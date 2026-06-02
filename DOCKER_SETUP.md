# Docker Setup for PropertyConnect (Windows)

Docker Desktop is **installed**. It cannot start until **WSL2 + CPU virtualization** work.

## Current error

```
WSL2 is unable to start since virtualisation is not enabled on this machine.
Docker Desktop is unable to start
```

## Fix (in order)

### Step 1 — Run the fix script (Administrator)

1. Press **Win**, type **PowerShell**
2. Right-click **Windows PowerShell** → **Run as administrator**
3. Run:

```powershell
cd "c:\Users\Centric\Downloads\propertyconnect-ai-deploy-ready\propertyconnect-ai"
Set-ExecutionPolicy -Scope Process Bypass -Force
.\scripts\fix-docker-wsl.ps1
```

4. **Restart your PC** when the script finishes.

### Step 2 — Enable virtualization in BIOS (most important)

After restart, if `wsl --status` still mentions virtualization:

1. Shut down the PC (not sleep).
2. Power on and press the BIOS key repeatedly:
   - **Dell / Lenovo**: `F2` or `F12`
   - **HP**: `F10` or `Esc`
   - **ASUS**: `F2` or `Del`
   - **Acer**: `F2`
3. Find and **Enable**:
   - **Intel Virtualization Technology** (VT-x), or
   - **AMD-V** / **SVM Mode**
4. **Save & Exit** (often `F10`).

Guide: https://aka.ms/enablevirtualization

### Step 3 — Verify after reboot

```powershell
wsl --status
wsl --install -d Ubuntu
docker ps
```

`docker ps` should return a table (even if empty), not an error.

### Step 4 — Start Evolution API

```powershell
cd "c:\Users\Centric\Downloads\propertyconnect-ai-deploy-ready\propertyconnect-ai"
docker compose -f docker-compose.evolution.yml up -d
```

Open **Docker Desktop** first if `docker ps` fails.

### Step 5 — Pair WhatsApp

1. `npm run dev`
2. http://localhost:3000/admin/settings/whatsapp
3. Create Instance → Generate QR → scan in WhatsApp → Linked Devices

## Optional: Windows Features GUI

**Settings → Apps → Optional features → More Windows features**

Ensure these are checked:

- Windows Subsystem for Linux
- Virtual Machine Platform
- Hyper-V (if available on your Windows edition)

## Still stuck?

- Disable **Memory Integrity** temporarily: Settings → Privacy & security → Windows Security → Device security → Core isolation
- Disconnect **Fortinet VPN** during first Docker start (VPN can block virtual adapters)
- In Docker Desktop: **Settings → General → Use the WSL 2 based engine** (checked)
