---
title: "Déploiement d’un réseau virtuel Azure via un modèle ARM"
slug: azure-arm-template-virtual-network-deployment-infrastructure-as-code
pubDatetime: 2026-08-29T00:00:00Z
description: "Standardisation du provisionnement d’un réseau virtuel Azure avec un modèle ARM pour garantir la cohérence, la traçabilité et la conformité des déploiements."
featured: true
draft: false
tags: ["Azure", "Cloud", "ARM Template", "Virtual Network"]
---

## Table of Contents

## Résumé pour la direction

### Scenario
L’équipe Nautilus DevOps cherche à standardiser le provisionnement réseau dans Azure en adoptant une approche Infrastructure as Code (IaC). L’objectif est de remplacer les créations manuelles ou semi-manuelles par un modèle déclaratif, versionné et réutilisable, afin de garantir des déploiements homogènes entre les environnements.

Dans ce cas, le besoin portait sur le déploiement d’un réseau virtuel Azure nommé **arm-vnet-datacenter** avec une plage d’adressage **192.168.0.0/16**, tout en appliquant les standards de marquage de l’entreprise avec les tags **displayName=arm-vnet-datacenter** et **Environment=KKE-datacenter**.

Cette démarche répond à plusieurs enjeux métiers : amélioration de la gouvernance cloud, réduction des écarts de configuration, facilitation des contrôles de conformité et accélération des opérations de déploiement grâce à des composants réutilisables et audités.

### Resolution
Le réseau virtuel a été mis à jour directement dans le fichier de template ARM au sein de l'environnement de travail, puis déployé via Azure CLI au sein du groupe de ressources cible (`kml_rg_main-77bb569dcf9d4e6c`). Le résultat obtenu est un provisionnement cohérent, reproductible et aligné sur les standards de nommage et de tagging attendus.

La validation du déploiement confirme que la ressource **arm-vnet-datacenter** a bien été créée avec la plage CIDR demandée et les métadonnées d’entreprise associées, avec un état de provisionnement validé à Succeeded.

## Technical Implementation

### Topology
The target architecture is intentionally simple and focused on network standardization through declarative deployment. The solution provisions a single Azure Virtual Network with the following parameters:

- **Resource type:** `Microsoft.Network/virtualNetworks`
- **Virtual network name:** `arm-vnet-datacenter`
- **Address space:** `192.168.0.0/16`
- **Tags:**
  - `displayName=arm-vnet-datacenter`
  - `Environment=KKE-datacenter`

The deployment is executed headlessly through **Azure CLI**, utilizing a JSON ARM template updated via terminal text editors (**vi**). This approach makes the network configuration deterministic and suitable for source control and change reviews.

> [!INFO]
> **Architectural Insight:** Declarative IaC such as ARM, Bicep, or Terraform is superior to imperative GUI/CLI creation because the desired end state is explicitly documented in code. This improves state tracking, enables peer review through pull requests, and reduces configuration drift by ensuring environments are rebuilt from the same reviewed definition instead of relying on manual operator actions.

### Action
The implementation consisted of locating the existing ARM template in `/root/arm-templates/vnet-deployment-template.json`, modifying its configuration to match the required network space and corporate tags, and executing the deployment via **Azure CLI**.

To complete this effectively within the lab environment, the JSON structure was directly modified using the `vi` text editor to reflect the new target state.

![Azure Configuration](@/assets/images/2026-08-28-azure-arm-template-virtual-network-deployment-vi.webp)

#### 1. Modified ARM Template
```json file="vnet-deployment-template.json"
{
    "$schema": "https://schema.management.azure.com/schemas/2019-04-01/deploymentTemplate.json#",
    "contentVersion": "1.0.0.0",
    "parameters": {},
    "functions": [],
    "variables": {},
    "resources": [
        {
            "name": "arm-vnet-datacenter",
            "type": "Microsoft.Network/virtualNetworks",
            "apiVersion": "2023-11-01",
            "location": "[resourceGroup().location]",
            "tags": {
                "displayName": "arm-vnet-datacenter",
                "Environment": "KKE-datacenter"
            },
            "properties": {
                "addressSpace": {
                    "addressPrefixes": [
                        "192.168.0.0/16"
                    ]
                }
            }
        }
    ],
    "outputs": {
    }
}
```

#### 2. Resource Group Discovery and Deployment
First, locate the target resource group matching the lab criteria using a filtered query:

![Azure Configuration](@/assets/images/azure-task-20260828-232008-azure-arm-template-virtual-network-deployment.webp)

```bash file="deploy-vnet.sh"
#!/usr/bin/env bash
set -euo pipefail

RESOURCE_GROUP=$(az group list --query '[].name' --output tsv | grep 'kml')

az deployment group create \
  --resource-group "$RESOURCE_GROUP" \
  --template-file /root/arm-templates/vnet-deployment-template.json

```

#### 3. Verification
Verify the deployed virtual network properties, address space, and associated tags using YAML output format for complete visibility:

```bash file="verify-vnet.sh"
#!/usr/bin/env bash
set -euo pipefail

az network vnet list \
  --resource-group kml_rg_main-77bb569dcf9d4e6c \
  --query "[].{Name: name, AddressSpace: addressSpace.addressPrefixes, Tags: tags}" \
  --output yaml
```
![Azure Configuration](@/assets/images/2026-08-28-azure-arm-template-virtual-network-deployment-verify.webp)

> [!SUCCESS]
> The deployment concluded with a `Succeeded` provisioning state. The VNet properties precisely match the governance requirements for CIDR and tagging standards.

> [!WARNING]
> Always validate JSON syntax and verify bracket/comma placements within the `tags` and `properties` blocks when modifying ARM templates manually via vi to prevent deployment validation failures.
