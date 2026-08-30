---
title: "Déployer une machine virtuelle Azure Ubuntu avec bootstrap Nginx via Portail et CLI"
slug: azure-ubuntu-vm-nginx-bootstrap-portal-cli-cloud-init
pubDatetime: 2026-08-29T00:00:00Z
description: "Ce guide présente le déploiement d’une VM Azure Ubuntu avec installation automatique de Nginx via Cloud-Init, en utilisant à la fois le Portail Azure et Azure CLI."
featured: true
draft: false
tags: ["Azure", "Cloud", "Azure CLI", "Cloud-Init"]
---

## Table of Contents

## Résumé pour la direction

### Scenario

Dans le cadre d’un déploiement d’infrastructure reproductible sur Azure, l’objectif était de provisionner une machine virtuelle Ubuntu nommée `devops-vm` dans la région **East US**, avec exposition du service **HTTP sur le port 80** et installation automatique de **Nginx** dès le premier démarrage.

Ce besoin répond à plusieurs enjeux opérationnels et métiers : accélération du provisioning, standardisation des configurations système, réduction des interventions manuelles et amélioration de la capacité de reprise. L’utilisation de **Cloud-Init** permet d’initialiser le serveur de manière déclarative, aussi bien depuis le **Portail Azure** que via **Azure CLI**, tout en garantissant un résultat cohérent.

### Resolution

La machine virtuelle a été déployée avec succès et configurée pour installer automatiquement Nginx au boot grâce à un fichier `cloud-init.txt` injecté comme **Custom Data**. Le trafic HTTP a été autorisé au niveau réseau via le **Network Security Group**.

Le résultat valide une approche moderne d’administration d’infrastructure : déploiement plus rapide, configuration homogène, réduction des écarts entre environnements et meilleure préparation aux scénarios d’industrialisation, d’auto-scaling et de reprise après incident.

## Technical Implementation

### Topology

The target architecture is a single **Ubuntu-based Azure Virtual Machine** deployed in **East US** with **HTTP (port 80)** exposed for web access. The VM is named `devops-vm` and bootstraps **Nginx** automatically using **Cloud-Init** during first boot.

From a connectivity perspective, Azure creates or associates the required virtual networking resources, and HTTP access is explicitly allowed through the attached **NSG rule**. The implementation supports both a **portal-based deployment** and a **headless CLI-driven workflow**, making it suitable for learning, validation, and progression toward Infrastructure as Code practices.

![Azure Configuration](@/assets/images/azure-task-20260829-151259-azure-ubuntu-vm-nginx-bootstrap-cloud-init.webp)

> [!INFO]
> This deployment pattern is intentionally simple and efficient. Azure CLI can implicitly create supporting resources during `az vm create` when no pre-existing network or resource dependencies are mandated.

#### Architectural Insight

Cloud-Init is superior to manual SSH configuration because it shifts server initialization from an interactive, error-prone process to a **declarative and repeatable bootstrap model**. Instead of logging in after provisioning and installing packages by hand, the VM is configured automatically on first boot.

Key benefits include:

- **Immutable infrastructure mindset**: configuration is defined up front rather than manually applied afterward.
- **Auto-scaling readiness**: every new VM instance can self-configure identically without operator involvement.
- **Faster disaster recovery**: rebuilding a server becomes a provisioning task, not a restoration of undocumented manual steps.
- **Operational consistency**: reduces configuration drift across environments.

> [!SUCCESS]
> Cloud-Init turns VM provisioning into a predictable deployment artifact rather than a one-off administrative session.

### Action

The implementation was completed using both the **Azure Portal** and **Azure CLI**, with the same Cloud-Init payload used in each path.

#### 1. Create the Cloud-Init configuration

The following YAML installs Nginx, ensures the package cache is updated, and starts/enables the service automatically.

```yaml file="cloud-init.txt"
#cloud-config
package_upgrade: true
packages:
  - nginx

runcmd:
  - systemctl enable nginx
  - systemctl start nginx
```
Using cat commande to create yaml file cloud-init.txt
```yaml file="cloud-init.txt"
cat <<EOF > cloud-init.txt
#cloud-config
package_upgrade: true
packages:
  - nginx
runcmd:
  - systemctl enable nginx
  - systemctl start nginx
EOF
```
> [!NOTE]
> Save the file exactly as `cloud-init.txt` before using it in Azure Portal Custom Data or the `--custom-data` CLI parameter.

#### 2. Deploy through Azure Portal

In the Azure Portal, the VM was created with these key settings:

- **Region**: East US
- **VM name**: `devops-vm`
- **Image**: Ubuntu
- **Inbound port**: HTTP (port 80)
- **Custom Data**: contents of `cloud-init.txt`
![Azure Configuration](@/assets/images/2026-08-29-azure-configuration-cloud-init.webp)

Execution flow in the portal:

1. Open **Create a virtual machine**.
2. Select the Ubuntu image and define the VM name as `devops-vm`.
3. Choose **East US** as the deployment region.
4. Configure authentication as required by policy.
5. Under inbound rules, allow **HTTP (80)**.
6. In the **Advanced** section, paste the Cloud-Init YAML into **Custom Data**.
7. Review and create the VM.
8. After deployment, validate by browsing to the VM public IP.

> [!WARNING]
> If Custom Data is omitted, Nginx will not be installed automatically and the VM will require post-deployment manual configuration.

#### 3. Deploy through Azure CLI

The CLI workflow provides a faster and more reproducible alternative to the GUI. It also aligns better with automation pipelines and future IaC adoption.

First, create a resource group if needed:

```bash file="create-resource-group.sh"
az group create \
  --name rg-devops-vm \
  --location eastus
```
OR 
Identify your target resource group:
```bash file="get-resource-group.sh"
RESOURCE_GROUP=$(az group list --query '[].name' --output tsv)
```

Then create the VM with Cloud-Init:

```bash file="create-vm.sh"
az vm create \
  --resource-group "$RESOURCE_GROUP" \
  --name devops-vm \
  --location eastus \
  --size Standard_B1s \
  --image Ubuntu2204 \
  --admin-username azureuser \
  --authentication-type ssh \
  --ssh-key-values ~/.ssh/id_rsa.pub \
  --storage-sku Standard_LRS \
  --custom-data cloud-init.txt
```

Open HTTP traffic on port 80:

```bash file="open-http-port.sh"
az vm open-port \
  --resource-group "$RESOURCE_GROUP" \
  --name devops-vm \
  --port 80
```

#### 4. Validate the deployment

After the VM finishes provisioning:

1. Retrieve the public IP from the Azure Portal or CLI.
2. Open a browser and access `http://<public-ip>`.
3. Confirm the default Nginx welcome page is displayed.

Optional validation via SSH:

```bash file="validate-nginx.sh"
ssh azureuser@<public-ip> "systemctl status nginx --no-pager"
```

> [!SUCCESS]
> A successful Nginx landing page confirms that compute provisioning, bootstrap automation, and network exposure were all completed correctly.

#### 5. Transition from GUI to IaC

This task demonstrates a practical progression path:

- **Portal** is useful for discovery, learning, and quick validation.
- **CLI** improves repeatability and speed.
- The next logical step is to convert the same deployment pattern into full **Infrastructure as Code**, such as Bicep or Terraform.

By externalizing initialization logic into Cloud-Init and standardizing deployment commands, the environment becomes easier to automate, version, audit, and rebuild.

> [!INFO]
> Even before adopting full IaC, using `az vm create` with `--custom-data` already introduces declarative provisioning principles and reduces reliance on manual server configuration.
