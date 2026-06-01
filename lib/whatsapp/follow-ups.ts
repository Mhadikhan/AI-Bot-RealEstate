import { prisma } from "../prisma";
import { personalizeBroadcastMessage, sendWhatsAppText } from "../whatsapp-cloud";
import { isWhatsAppLiveMode } from "./config";

export async function listFollowUpSequences() {
  return prisma.followUpSequence.findMany({
    orderBy: { createdAt: "desc" },
    include: { steps: { orderBy: { stepOrder: "asc" } }, _count: { select: { enrollments: true } } }
  });
}

export async function createFollowUpSequence(input: {
  name: string;
  description?: string;
  steps: { delayHours: number; messageTemplate: string; triggerCondition?: string }[];
}) {
  return prisma.followUpSequence.create({
    data: {
      name: input.name,
      description: input.description,
      steps: {
        create: input.steps.map((step, index) => ({
          stepOrder: index + 1,
          delayHours: step.delayHours,
          messageTemplate: step.messageTemplate,
          triggerCondition: step.triggerCondition || "NO_REPLY"
        }))
      }
    },
    include: { steps: { orderBy: { stepOrder: "asc" } } }
  });
}

export async function enrollLeadsInSequence(sequenceId: string, leadIds: string[], broadcastId?: string) {
  const sequence = await prisma.followUpSequence.findUnique({
    where: { id: sequenceId },
    include: { steps: { orderBy: { stepOrder: "asc" } } }
  });

  if (!sequence || sequence.steps.length === 0) return [];

  const firstStep = sequence.steps[0];
  const nextRunAt = new Date(Date.now() + firstStep.delayHours * 60 * 60 * 1000);

  const enrollments = [];
  for (const leadId of leadIds) {
    const existing = await prisma.followUpEnrollment.findFirst({
      where: { sequenceId, leadId, status: "ACTIVE" }
    });
    if (existing) continue;

    enrollments.push(
      await prisma.followUpEnrollment.create({
        data: {
          sequenceId,
          leadId,
          broadcastId: broadcastId || null,
          currentStep: 0,
          status: "ACTIVE",
          nextRunAt
        }
      })
    );
  }

  return enrollments;
}

export async function stopEnrollmentOnReply(leadId: string) {
  await prisma.followUpEnrollment.updateMany({
    where: { leadId, status: "ACTIVE" },
    data: { status: "STOPPED", stoppedReason: "Lead replied on WhatsApp" }
  });
}

export async function processDueFollowUps() {
  const due = await prisma.followUpEnrollment.findMany({
    where: {
      status: "ACTIVE",
      nextRunAt: { lte: new Date() }
    },
    include: {
      sequence: { include: { steps: { orderBy: { stepOrder: "asc" } } } },
      lead: true
    },
    take: 25
  });

  const results = [];
  const isLive = isWhatsAppLiveMode();

  for (const enrollment of due) {
    const steps = enrollment.sequence.steps;
    const nextStepIndex = enrollment.currentStep;
    const step = steps[nextStepIndex];

    if (!step || !enrollment.lead?.phone) {
      await prisma.followUpEnrollment.update({
        where: { id: enrollment.id },
        data: { status: "COMPLETED", stoppedReason: "No more steps or missing phone" }
      });
      continue;
    }

    const body = personalizeBroadcastMessage(step.messageTemplate, enrollment.lead.name);

    if (isLive) {
      const result = await sendWhatsAppText(enrollment.lead.phone, body);
      if (!result.ok) {
        await prisma.followUpEnrollment.update({
          where: { id: enrollment.id },
          data: { status: "FAILED", stoppedReason: result.error }
        });
        results.push({ enrollmentId: enrollment.id, ok: false, error: result.error });
        continue;
      }
    }

    const isLast = nextStepIndex + 1 >= steps.length;
    const nextStep = steps[nextStepIndex + 1];

    await prisma.followUpEnrollment.update({
      where: { id: enrollment.id },
      data: {
        currentStep: nextStepIndex + 1,
        lastSentAt: new Date(),
        status: isLast ? "COMPLETED" : "ACTIVE",
        nextRunAt: isLast || !nextStep ? null : new Date(Date.now() + nextStep.delayHours * 60 * 60 * 1000)
      }
    });

    results.push({ enrollmentId: enrollment.id, ok: true, simulated: !isLive, step: step.stepOrder });
  }

  return results;
}
