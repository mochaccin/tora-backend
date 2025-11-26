#!/bin/bash

# Script para solucionar permisos de Docker en la VM
# Ejecutar con: bash fix-docker-permissions.sh

echo "=== Solucionando permisos de Docker ==="
echo ""

# Verificar si Docker está instalado
if ! command -v docker &> /dev/null; then
    echo "❌ Docker no está instalado. Instalando Docker..."
    echo "Por favor, instala Docker primero con:"
    echo "sudo apt update && sudo apt install docker.io docker-compose -y"
    exit 1
fi

# Verificar si el servicio Docker está corriendo
if ! sudo systemctl is-active --quiet docker; then
    echo "⚠️  El servicio Docker no está corriendo. Iniciándolo..."
    sudo systemctl start docker
    sudo systemctl enable docker
fi

# Verificar si el usuario ya está en el grupo docker
if groups | grep -q docker; then
    echo "✅ El usuario ya está en el grupo docker"
else
    echo "➕ Agregando usuario al grupo docker..."
    sudo usermod -aG docker $USER
    echo "✅ Usuario agregado al grupo docker"
    echo ""
    echo "⚠️  IMPORTANTE: Necesitas reiniciar la sesión SSH para que los cambios surtan efecto."
    echo "   Opciones:"
    echo "   1. Cerrar y volver a abrir la conexión SSH"
    echo "   2. Ejecutar: newgrp docker"
fi

echo ""
echo "=== Verificando configuración ==="
echo "Usuario actual: $USER"
echo "Grupos: $(groups)"
echo ""
echo "=== Pasos siguientes ==="
echo "1. Si acabas de agregar el usuario al grupo, ejecuta: newgrp docker"
echo "2. O reconéctate a la VM"
echo "3. Luego ejecuta: docker-compose up -d --build"

