---
title: "Provisionner un disque managé Azure autonome pour une migration d’infrastructure"
slug: azure-managed-disk-provisioning-standalone-disk
pubDatetime: 2026-08-25T00:00:00Z
description: "Création d’un disque managé Azure autonome de 2 Gio en Standard_LRS pour accompagner une migration d’infrastructure avec une gestion plus granulaire des données."
featured: false
draft: false
tags: ["Azure", "Cloud", "Managed Disk", "Azure CLI"]
---

## Table of Contents

## Résumé pour la direction

### Scenario

L’équipe Nautilus DevOps avait besoin de provisionner un disque managé Azure autonome dans le cadre d’une migration d’infrastructure par phases. L’objectif était de dissocier le stockage de certaines charges de travail afin d’améliorer la granularité de gestion des données, de simplifier les futures opérations d’attachement à des machines virtuelles et de préparer un modèle d’exploitation plus flexible.

Les exigences étaient simples mais importantes : créer un disque dans la région **East US**, au sein du groupe de ressources **kml_rg_main-4eac42a8c1bd40ca**, avec une capacité de **2 Gio** et un niveau de redondance **Standard_LRS**. Une validation préalable dans le portail Azure a permis de confirmer l’alignement avec les contraintes de taille, de coût et de résilience attendues pour cette étape de migration.

### Resolution

Le disque managé **xfusion-disk** a été défini avec les paramètres attendus, ce qui répond au besoin de stockage autonome pour la migration progressive. Cette approche apporte une meilleure modularité opérationnelle, facilite les futurs rattachements aux ressources de calcul et maintient un bon équilibre entre durabilité locale et maîtrise des coûts grâce au choix du SKU **Standard_LRS**.

La standardisation de cette opération en scripts **Azure CLI** et **PowerShell** renforce également la reproductibilité, réduit les écarts manuels et prépare une transition naturelle vers une gestion davantage orientée Infrastructure as Code.

## Technical Implementation

### Topology

The deployment target is a standalone Azure managed disk with the following parameters:

- **Resource Group:** `kml_rg_main-4eac42a8c1bd40ca`
- **Region:** `East US`
- **Disk Name:** `xfusion-disk`
- **Size:** `2 GiB`
- **SKU:** `Standard_LRS`

This is a lightweight headless provisioning task well suited for CLI and PowerShell automation. Since the requirement is only to create an unattached managed disk, no virtual network, VM, or additional dependencies are needed.

![Azure Configuration](@/assets/images/azure-task-20260825-115507.webp)

> [!INFO]
> **Architectural Insight:** `LRS` (Locally Redundant Storage) keeps multiple synchronous copies of data within a single datacenter, offering cost-efficient durability for workloads that do not require zonal resilience. `ZRS` (Zone-Redundant Storage) replicates data across multiple availability zones in the same region, increasing resilience against zonal failure but at a higher cost. For a small standalone migration disk with no stated zone-level availability requirement, `Standard_LRS` is the more economical and appropriate choice.

### Action

The configuration was first reviewed in Azure Portal to validate the intended disk size and redundancy model. After confirmation, the operation can be executed concisely using either Azure CLI or Azure PowerShell.

The implementation below intentionally keeps the logic minimal and idiomatic, matching the scope of the task without unnecessary abstraction.

> [!NOTE]
> The disk is created as an empty managed disk and can later be attached to a VM or used in subsequent migration workflows.

### Azure CLI

```bash file="create-managed-disk.sh"
az disk create \
  --resource-group kml_rg_main-4eac42a8c1bd40ca \
  --name xfusion-disk \
  --location eastus \
  --size-gb 2 \
  --sku Standard_LRS
```

### Azure PowerShell

```powershell file="Create-ManagedDisk.ps1"
New-AzDiskConfig `
  -Location "East US" `
  -CreateOption Empty `
  -DiskSizeGB 2 `
  -SkuName "Standard_LRS" |
New-AzDisk `
  -ResourceGroupName "kml_rg_main-4eac42a8c1bd40ca" `
  -DiskName "xfusion-disk"
```
![Azure Configuration](@/assets/images/2026-08-25-azure-managed-disk.webp)
> [!SUCCESS]
> This implementation converts a portal-validated configuration into repeatable command-line automation, supporting consistency and future IaC alignment with minimal operational overhead.
