---
title: "Associer une adresse IP publique existante à la carte réseau d’une machine virtuelle Azure"
slug: azure-associate-existing-public-ip-to-vm-nic
pubDatetime: 2026-08-19T00:00:00Z
description: "Association d’une adresse IP publique statique existante à la carte réseau d’une machine virtuelle Azure afin d’activer l’accès entrant externe de manière contrôlée."
featured: false
draft: false
tags: ["Azure", "Cloud", "Network Interface", "Public IP"]
---

## Table of Contents

## Résumé pour la direction

### Scenario
Dans le cadre des besoins d’accessibilité externe de l’équipe Nautilus DevOps, il était nécessaire d’exposer une machine virtuelle Azure existante à Internet via une adresse IP publique déjà provisionnée. L’objectif consistait à associer cette ressource réseau à l’interface réseau de la machine virtuelle, sans recréer l’infrastructure, afin de préserver la cohérence de l’environnement et de limiter les changements opérationnels.

Cette action répond à un besoin d’exploitation courant : rendre un service hébergé sur une VM accessible depuis l’extérieur tout en s’appuyant sur une adresse IP publique statique existante. Le périmètre concernait un groupe de ressources localisé en **South Central US**, avec une machine virtuelle, sa carte réseau dédiée et une adresse IP publique déjà disponibles.

### Resolution
L’adresse IP publique existante a été correctement associée à la carte réseau de la machine virtuelle ciblée. Cette mise à jour a permis d’activer la connectivité entrante externe attendue pour la VM **datacenter-vm-pip**, tout en conservant les ressources réseau déjà en place.

Le résultat apporte une valeur immédiate sur le plan opérationnel : exposition contrôlée du service, réutilisation des composants existants, et standardisation de la procédure grâce à des commandes **Azure CLI** et **PowerShell** facilement réexécutables dans une logique d’automatisation.

> [!SUCCESS] L’association de l’IP publique à la carte réseau a été réalisée avec succès en s’appuyant sur les ressources existantes, sans redéploiement de la VM.

## Technical Implementation

### Topology
The implementation targeted an existing Azure virtual machine networking stack in the following scope:

- **Resource Group:** `kml_rg_main-bc1f6888c33545d0`
- **Region:** `South Central US`
- **Virtual Machine:** `datacenter-vm-pip`
- **Network Interface:** `datacenter-vm-pipVMNic`
- **Public IP Address:** `datacenter-pip`

The objective was to bind the existing static Public IP resource to the VM’s primary NIC IP configuration. Since the resources were already deployed, this was an in-place network update rather than a provisioning workflow.

This operation can be performed headlessly using Azure CLI or Azure PowerShell, making it suitable for repeatable administration and future Infrastructure as Code alignment.

![Azure Configuration](@/assets/images/azure-task-20260819_associate-pip-to-nic-vm.webp)

> [!INFO] The update targets the NIC IP configuration directly. This is the Azure-native method when attaching an existing Public IP to an already deployed VM network interface.

### Action
The portal-based action can be translated into concise scripted operations by retrieving the existing NIC and Public IP, then updating the NIC IP configuration to reference the Public IP resource.

> [!TIP] Architectural Insight: Zero Trust & Public IPs
> Associating a Public IP enables external reachability at the network layer, but under Azure's Zero Trust architecture, effective access is explicitly denied by default. Connectivity ultimately depends on proper **Network Security Group (NSG)** rules, guest OS firewall settings, and active listening services on the VM.

> [!NOTE] This task was originally completed in the Azure Portal, but the CLI and PowerShell equivalents provide a cleaner operational baseline for scripted administration and future IaC adoption.

### Azure CLI
Use the following Azure CLI script to associate the existing Public IP with the existing NIC:

```bash file="associate-public-ip-to-nic.sh"
#!/usr/bin/env bash

RG="kml_rg_main-bc1f6888c33545d0"
NIC="datacenter-vm-pipVMNic"
PIP="datacenter-pip"

az network nic ip-config update \
  --resource-group "$RG" \
  --nic-name "$NIC" \
  --name "ipconfig1" \
  --public-ip-address "$PIP"
```

> [!NOTE] `ipconfig1` is the default primary IP configuration name for many Azure VM NICs. If your NIC uses a different IP configuration name, list it first with `az network nic show`.

Optional validation:

```bash file="validate-public-ip-association.sh"
#!/usr/bin/env bash

RG="kml_rg_main-bc1f6888c33545d0"
NIC="datacenter-vm-pipVMNic"

az network nic show \
  --resource-group "$RG" \
  --name "$NIC" \
  --query "ipConfigurations[].{name:name,publicIp:publicIPAddress.id}" \
  --output table
```

### Azure PowerShell
Use the following concise PowerShell script to update the NIC and attach the existing Public IP:

```powershell file="Associate-PublicIpToNic.ps1"
$ResourceGroupName = "kml_rg_main-bc1f6888c33545d0"
$NicName = "datacenter-vm-pipVMNic"
$PublicIpName = "datacenter-pip"

$nic = Get-AzNetworkInterface -ResourceGroupName $ResourceGroupName -Name $NicName
$pip = Get-AzPublicIpAddress -ResourceGroupName $ResourceGroupName -Name $PublicIpName

$nic.IpConfigurations[0].PublicIpAddress = $pip
$nic | Set-AzNetworkInterface
```

Optional validation:

```powershell file="Validate-PublicIpAssociation.ps1"
$ResourceGroupName = "kml_rg_main-bc1f6888c33545d0"
$NicName = "datacenter-vm-pipVMNic"

(Get-AzNetworkInterface -ResourceGroupName $ResourceGroupName -Name $NicName).IpConfigurations |
Select-Object Name, @{Name="PublicIpId";Expression={$_.PublicIpAddress.Id}}
```
