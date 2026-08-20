---
title: "Configuration de l’accès SSH sans mot de passe pour le compte root sur une machine virtuelle Linux"
slug: root-passwordless-ssh-setup-linux-vm-authorized-keys
pubDatetime: 2026-08-20T00:00:00Z
description: "Mise en place d’un accès SSH par clé publique pour le compte root, avec validation des permissions POSIX et test de connexion sans mot de passe."
featured: false
draft: false
tags: ["Azure", "Cloud", "SSH", "Linux"]
---

## Table of Contents

## Résumé pour la direction

### Scenario

Dans le cadre d’une opération d’administration système ciblée, il était nécessaire d’activer un accès SSH par clé publique pour le compte `root` sur la machine virtuelle `nautilus-vm`. L’objectif était de supprimer l’usage d’un mot de passe interactif pour cette connexion spécifique, afin de fiabiliser l’accès distant et de standardiser une méthode d’authentification basée sur des clés asymétriques.

Cette intervention répond à un besoin d’exploitation technique rapide sur un hôte Linux existant, avec un contrôle précis sur le fichier `authorized_keys` du compte privilégié. La tâche incluait également l’application des permissions POSIX strictes exigées par OpenSSH, condition indispensable au bon fonctionnement de l’authentification par clé.

### Resolution

L’accès SSH sans mot de passe pour `root` a été configuré avec succès sur `nautilus-vm` via l’injection de la clé publique `id_rsa.pub` dans `~root/.ssh/authorized_keys`. Les permissions ont été corrigées conformément aux exigences de sécurité d’OpenSSH, avec `700` sur le répertoire `.ssh` et `600` sur le fichier `authorized_keys`.

La validation finale a confirmé qu’une connexion distante en tant que `root` pouvait être établie sans saisie de mot de passe. La valeur livrée est une méthode d’accès plus cohérente pour les opérations d’administration contrôlées, tout en réduisant les erreurs liées à l’authentification manuelle.

## Technical Implementation

### Topology

The target system was the Linux virtual machine `nautilus-vm`. The source credential material was the client-side public key `id_rsa.pub`, which was appended to the `root` user's SSH trust store on the VM.

The implementation pattern was intentionally minimal and shell-driven:
- Target host: `nautilus-vm`
- Authentication source: client public key `~/.ssh/id_rsa.pub`
- Destination path: `/root/.ssh/authorized_keys`
- Security controls: strict POSIX permissions required by OpenSSH

This was handled as a CLI/headless operation using standard Bash commands rather than GUI-based administration.

![Terminal Setup](@/assets/images/azure-task-20260820-024802-configure-ssh-key-root-access.webp)

> [!INFO] Architectural Insight
> Direct Root SSH access is generally a production anti-pattern because it weakens Zero Trust principles and reduces auditability. A better operational model is to authenticate as a named user, enforce least privilege, and escalate with `sudo` so that accountability, session traceability, and access governance remain intact.

### Action

The setup was completed by creating the root SSH directory if needed, copying the client public key into `authorized_keys`, enforcing the required ownership and permissions, and validating passwordless access.

The implementation followed a precise, interactive terminal sequence to ensure proper key placement and strict POSIX permission enforcement. This hands-on approach guarantees that the SSH daemon's security prerequisites are met.

**Step 1: Connect to the target VM and escalate privileges**
```bash file="setup-root-passwordless-ssh.sh"
# Connect to the VM as the default administrative user
ssh -i ~/.ssh/id_rsa azureuser@<VM_PUBLIC_IP>

# Escalate to root
sudo su -
```

**Step 2: Configure the SSH directory and inject the public key**
```bash file="setup-root-passwordless-ssh.sh"
# Create the .ssh directory and enforce strict directory permissions (700)
mkdir -p ~/.ssh
chmod 700 ~/.ssh

# Use a text editor to paste the client's public key (from /root/.ssh/id_rsa.pub)
nano ~/.ssh/authorized_keys

# Enforce strict file permissions (600) to satisfy SSH daemon security checks
chmod 600 ~/.ssh/authorized_keys

# Exit the root session and disconnect from the VM
exit
exit
```

**Step 3: Validate passwordless root access**
```bash file="Validate-passwordless-root-access.sh"
# From the Azure client host, test the connection using the root identity
ssh -i /root/.ssh/id_rsa root@<VM_PUBLIC_IP>
```

> [!WARNING] OpenSSH will strictly reject key-based authentication if the `.ssh` directory or `authorized_keys` file is too permissive. Enforcing `700` and `600` permissions is a non-negotiable security requirement.
> 
![Terminal Setup](@/assets/images/2026-08-20_configure-ssh-key-root-access.webp)

> [!SUCCESS] Validation succeeded when SSH authenticated `root` using the installed public key and no password prompt was presented.
