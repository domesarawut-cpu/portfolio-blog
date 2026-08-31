---
title: "Redimensionnement d’un disque système Azure et montage persistant d’un disque de données sur une VM Linux"
slug: azure-vm-disk-resize-and-persistent-data-disk-mount-linux
pubDatetime: 2026-08-31T00:00:00Z
description: "Mise en œuvre du redimensionnement du disque OS et de l’ajout d’un disque de données avec montage persistant sur une machine virtuelle Azure Linux."
featured: false
draft: false
tags: ["Azure", "Cloud", "Linux", "Azure Storage", "Virtual Machine"]
---

## Table of Contents

## Résumé pour la direction

### Scenario

Dans le cadre de l’évolution d’une machine virtuelle Linux hébergée sur Azure, une augmentation de capacité de stockage était nécessaire pour répondre à la croissance des besoins applicatifs et à la séparation des usages entre le système d’exploitation et les données métiers. L’objectif était double : redimensionner le disque système existant à 64 Gio et ajouter un nouveau disque de données de 64 Gio afin de disposer d’un espace dédié, plus simple à administrer et plus sûr pour les opérations futures de maintenance.

Cette intervention s’inscrit dans une logique de bonnes pratiques cloud : isoler les données du disque OS, améliorer la flexibilité opérationnelle et préparer l’environnement à des besoins de montée en charge sans refonte complète de l’instance. La persistance du montage était également un prérequis critique afin de garantir la disponibilité du volume après redémarrage.

### Resolution

L’opération a été menée avec succès : le disque système a été redimensionné, un nouveau disque de données a été attaché, détecté côté système via SSH, formaté en `ext4`, puis monté de manière persistante sur `/mnt/xfusion-disk` grâce à une entrée contrôlée dans `/etc/fstab`.

La validation fonctionnelle a confirmé la disponibilité du nouveau volume après montage, ainsi que la conformité de la configuration avec les standards d’exploitation Linux sur Azure. La valeur métier apportée est immédiate : amélioration de la capacité de stockage, meilleure séparation des responsabilités système/données et réduction du risque opérationnel lors des redémarrages ou des maintenances.

## Technical Implementation

### Topology

The target design was a Linux virtual machine hosted in Azure with the following storage layout:

- **OS Disk**: resized to **64 GiB**
- **Data Disk**: newly attached **64 GiB** managed disk
- **Mount Point**: `/mnt/xfusion-disk`
- **Access Method**: SSH / headless Linux administration

This was primarily a **CLI-driven and headless operation** on the guest OS. Once the disk was attached from Azure, in-guest validation and configuration were performed through standard Linux commands.

![Azure Configuration](@/assets/images/azure-task-20260831-013601.webp)

> [!INFO]
> In cloud environments, newly attached disks may not appear under predictable device names across reboots or between VM families. Validation from inside the VM is required before formatting or mounting.

#### Architectural Insight

1. **Why `lsblk` is mandatory for non-deterministic cloud disk naming**  
   In Azure and other cloud platforms, the kernel-exposed device name for an attached disk is not guaranteed to match human expectation. A newly added disk may appear as `/dev/sda`, `/dev/sdb`, `/dev/sdc`, or under another mapped block device depending on platform behavior, drivers, and boot-time ordering. Running `lsblk` before any formatting step is therefore mandatory to positively identify the correct device and avoid destructive actions on the OS disk.

2. **Why the `nofail` parameter in `/etc/fstab` is critical**  
   A persistent mount entry without safeguards can prevent a VM from booting correctly if the referenced disk is temporarily unavailable, detached, or delayed during initialization. Adding the `nofail` option ensures the system continues booting even if the data disk cannot be mounted at startup. This is a critical resilience measure in cloud operations, where storage attachment states may occasionally vary during maintenance, scaling, or recovery scenarios.

> [!WARNING]
> Formatting the wrong device is irreversible for existing data. Always confirm the target block device with `lsblk` before running filesystem commands.

### Action

The implementation followed a simple and reliable Linux administration workflow after the Azure-side disk operations were completed.

1. **Connect to the VM through SSH**
2. **Identify the newly attached disk**
3. **Create an `ext4` filesystem on the correct device**
4. **Create the target mount directory**
5. **Mount the disk**
6. **Persist the mount in `/etc/fstab`**
7. **Validate the configuration**

As shown in the terminal execution below, attempting to format the temporary disk (`/dev/sdc`) fails safely because the system correctly identifies it as being in use. The `lsblk` output guided the dynamic selection of `/dev/sda` for the new data volume.

![Disk Formatting and Persistent Mount Execution](@/assets/images/2026-08-31-disk-persistent-mount-vm-linux.webp)

Command execution sequence corresponding to the terminal output:

```bash file="disk-validation-and-mount.sh"
lsblk
sudo mkfs.ext4 /dev/sda
sudo mkdir -p /mnt/xfusion-disk
sudo mount /dev/sda /mnt/xfusion-disk
echo '/dev/sda /mnt/xfusion-disk ext4 defaults,nofail 0 2' | sudo tee -a /etc/fstab
df -h
```

Command purpose summary:

- `lsblk`: lists block devices and mount points to identify the correct disk
- `mkfs.ext4`: creates the filesystem on the new data disk
- `mkdir -p`: creates the persistent mount directory
- `mount`: mounts the disk immediately without reboot
- `echo ... | sudo tee -a /etc/fstab`: safely appends the persistent mount entry, ensuring it survives reboots
- `df -h`: validates the active mount points and capacity

A more explicit inspection step can also be used before formatting:

```bash file="identify-disk.sh"
lsblk -f
```

Example persistent mount entry:

```fstab file="/etc/fstab"
/dev/sda /mnt/xfusion-disk ext4 defaults,nofail 0 2
```

> [!SUCCESS]
> Utilizing `echo` combined with `sudo tee -a` is a highly reliable pattern for appending configurations to protected system files like `/etc/fstab` without requiring interactive text editors, making it ideal for automation scripts.

> [!NOTE]
> This workflow reflects a practical transition from portal-based infrastructure changes to repeatable operational procedures executed through CLI and standard Linux system administration. In a larger environment, this exact pattern can be codified further into Cloud-Init or configuration management tools (Ansible) for consistency at scale.
