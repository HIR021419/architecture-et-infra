terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.0"
    }
  }
}

provider "aws" {
  region = "us-east-1" # Changez la région si nécessaire (ex: eu-west-3 pour Paris)
}

# 1. Création d'une paire de clés SSH pour la connexion
# Assurez-vous d'avoir généré votre clé locale avec: ssh-keygen -t rsa -f ~/.ssh/id_rsa
resource "aws_key_pair" "deployer" {
  key_name   = "deployer-key"
  public_key = file(pathexpand("~/.ssh/id_ed25519.pub"))
}

# 2. Groupe de sécurité (Pare-feu)
resource "aws_security_group" "web_sg" {
  name        = "vite_app_sg"
  description = "Allow HTTP and SSH traffic"

  ingress {
    description = "SSH"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# 3. Récupération de la dernière image Amazon Linux 2023
data "aws_ami" "amazon_linux_2023" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["al2023-ami-2023.*-x86_64"]
  }
}

# 4. Compression du code source local (exclut node_modules pour la rapidité)
data "archive_file" "app_source" {
  type        = "zip"
  source_dir  = path.module
  output_path = "${path.module}/app_bundle.zip"

  # Exclusions importantes pour ne pas envoyer de fichiers inutiles ou lourds
  excludes = [
    "node_modules",
    ".git",
    ".terraform",
    "*.tf",
    "*.tfstate*",
    "app_bundle.zip",
    "dist"
  ]
}

# 5. L'instance EC2
resource "aws_instance" "web_server" {
  ami                    = data.aws_ami.amazon_linux_2023.id
  instance_type          = "t3.micro" # t3.micro est éligible au free tier
  key_name               = aws_key_pair.deployer.key_name
  vpc_security_group_ids = [aws_security_group.web_sg.id]

  # Connexion SSH utilisée par les provisioners ci-dessous
  connection {
    type        = "ssh"
    user        = "ec2-user"
    # Use pathexpand here as well
    private_key = file(pathexpand("~/.ssh/id_ed25519"))
    host        = self.public_ip
  }

  # Étape A: Envoyer le zip sur le serveur
  provisioner "file" {
    source      = data.archive_file.app_source.output_path
    destination = "/home/ec2-user/app_bundle.zip"
  }

  # Étape B: Installation et Déploiement via script distant
  provisioner "remote-exec" {
    inline = [
      # Mettre à jour et installer les dépendances système
      "sudo dnf update -y",

      "curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -",
      "sudo dnf install -y nodejs nginx",

      # Vérification de la version installée
      "node -v",

      # Préparer le dossier de l'app
      "mkdir -p /home/ec2-user/app",
      "unzip /home/ec2-user/app_bundle.zip -d /home/ec2-user/app",

      # Build de l'application
      "cd /home/ec2-user/app",
      "echo 'Installation des dépendances NPM...'",
      "npm install",
      "echo 'Build de l application...'",
      "npm run build",

      # Déploiement sur Nginx (copie du dossier dist)
      # On assume que Vite build dans ./dist
      "sudo cp -r dist/* /usr/share/nginx/html/",

      # Configuration des permissions et démarrage de Nginx
      "sudo chown -R nginx:nginx /usr/share/nginx/html",
      "sudo chmod -R 755 /usr/share/nginx/html",
      "sudo systemctl enable nginx",
      "sudo systemctl start nginx"
    ]
  }
}

# 6. Output pour obtenir l'URL à la fin
output "app_url" {
  value = "http://${aws_instance.web_server.public_ip}"
}