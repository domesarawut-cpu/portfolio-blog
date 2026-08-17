---
title: "Provisionnement d’une adresse IP publique statique Azure pour un point d’entrée sécurisé"
slug: azure-static-public-ip-standard-sku-provisioning-secure-ingress
pubDatetime: 2026-08-17T00:00:00Z
description: "Mise en place d’une adresse IP publique Azure Standard et statique pour fournir un point d’entrée externe fiable et sécurisé à l’infrastructure de l’équipe Nautilus DevOps."
featured: false
draft: false
tags: ["Azure", "Cloud", "Public IP", "Networking"]
---

## Table of Contents

## Résumé pour la direction

### Scenario
Dans le cadre du provisioning de l’infrastructure de l’équipe Nautilus DevOps, il était nécessaire de créer un point d’entrée externe dédié afin d’exposer de futurs services de manière contrôlée et conforme aux bonnes pratiques Azure. Le besoin portait sur une adresse IP publique réservée, stable dans le temps, et adaptée à une intégration ultérieure avec une interface réseau ou un équilibreur de charge.

Le choix d’une **Public IP Standard** avec une **allocation statique** répond à plusieurs objectifs métiers et techniques : améliorer la prévisibilité des flux réseau, préparer l’architecture à des usages de production, et renforcer la posture de sécurité et de disponibilité de la plateforme.

### Resolution
La ressource **Azure Public IP** a été créée avec succès via le portail Azure en utilisant les paramètres attendus : **SKU Standard**, **allocation statique** et **IPv4**. L’adresse est désormais prête à être associée à une **NIC** ou à un **Load Balancer** selon les besoins d’exposition des services.

Cette mise en place apporte une base réseau fiable pour les prochains déploiements, réduit le risque de changement d’adresse côté exposition externe, et aligne l’environnement avec les recommandations modernes de conception Azure.

## Technical Implementation

### Topology
The deployed resource is a dedicated Azure Public IP designed to act as the secure external ingress point for the Nautilus DevOps environment.

**Resource parameters**
- **Name:** `nautilus-pip`
- **SKU:** `Standard`
- **Allocation method:** `Static`
- **IP version:** `IPv4`

The selected **Standard SKU** is aligned with current Azure best practices for production-oriented deployments, especially when predictable addressing and improved resiliency are required. The **static** allocation ensures the public endpoint remains stable over time, which is essential for firewall allowlisting, DNS mapping, and service exposure planning.

This operation was initially completed through the **Azure Portal**, but it is straightforward to convert into a repeatable **CLI** or **PowerShell** workflow for Infrastructure as Code adoption.

![Azure Configuration](@/assets/images/azure-task-20260817-052901.webp)

> [!INFO]
> This Public IP is provisioned as a standalone network resource and is ready to be attached later to a Network Interface or Load Balancer.

> [!TIP] Architectural Design Decision: Public IP SKU
> While the provisioning requirements were broad, the **Standard SKU** with a **Static Allocation Method** was deliberately chosen over the Basic SKU. 
>
> The Basic SKU is on a deprecation path and lacks modern enterprise capabilities. The Standard SKU is secure by default (closed to inbound traffic unless explicitly permitted by an NSG), supports Zone Redundancy, and provides a fixed IP address that guarantees stability for DNS records and third-party firewall whitelisting.
> 
### Action
The implementation followed a simple resource provisioning workflow in the Azure Portal:

1. Opened the **Public IP addresses** service in Azure.
2. Started a new resource creation.
3. Defined the resource name as `nautilus-pip`.
4. Selected **Standard** as the SKU.
5. Chose **Static** as the allocation method.
6. Set the IP version to **IPv4**.
7. Validated and deployed the resource.

From an automation perspective, this portal-based task maps directly to concise infrastructure commands. Since only the Public IP was required, no extra networking components were created, keeping the implementation minimal and aligned with clean IaC practices.

> [!SUCCESS]
> The Public IP was successfully provisioned and is immediately reusable for downstream network bindings.

![Azure Deploy Public IP](@/assets/images/2026-08-16_deploy-publicIP.webp)

> [!NOTE]
> For repeatability across environments, this provisioning step should ideally be embedded into a scripted deployment workflow rather than repeated manually in the portal.

## Azure CLI

```bash file="provision-public-ip.sh"
az network public-ip create \
  --resource-group <resource-group> \
  --name nautilus-pip \
  --sku Standard \
  --allocation-method Static \
  --version IPv4
```

## Azure PowerShell

```powershell file="provision-public-ip.ps1"
New-AzPublicIpAddress `
  -ResourceGroupName "<resource-group>" `
  -Name "nautilus-pip" `
  -Sku Standard `
  -AllocationMethod Static `
  -IpAddressVersion IPv4 `
  -Location "<location>"
```
