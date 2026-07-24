# Cria a chave de assinatura do app Android. RODAR UMA VEZ SO.
#
#   powershell -File scripts\criar-chave.ps1
#
# O keytool vai perguntar, no seu terminal:
#   · a senha do repositorio de chaves (digite duas vezes)
#   · nome, unidade, organizacao, cidade, estado, pais
#   · a senha da chave — ACEITE a mesma do repositorio (so dar Enter)
#
# Sugestao para os campos, se quiser algo pronto:
#   Nome e sobrenome......: Nosso Passo
#   Unidade organizacional: Nosso Passo
#   Organizacao...........: Novastrus
#   Cidade / Estado.......: os seus
#   Codigo de pais........: BR
#
# ⚠️ A senha e o arquivo sao PERMANENTES. Perdidos, nao ha atualizacao do app
# nunca mais sob o pacote br.com.nossopasso.app — so publicar outro, do zero,
# sem os usuarios nem as avaliacoes. Guarde os dois num cofre de senhas, COM
# COPIA, antes de seguir adiante.

$ErrorActionPreference = 'Stop'

$raiz    = Split-Path -Parent $PSScriptRoot
$twa     = Join-Path $raiz 'twa'
$destino = Join-Path $twa 'android-keystore.jks'
$keytool = Join-Path $env:USERPROFILE '.bubblewrap\jdk\bin\keytool.exe'

if (-not (Test-Path $keytool)) { throw "keytool nao encontrado em $keytool" }
if (-not (Test-Path $twa))     { New-Item -ItemType Directory -Force -Path $twa | Out-Null }

if (Test-Path $destino) {
  Write-Output ""
  Write-Output "Ja existe uma chave em:"
  Write-Output "  $destino"
  Write-Output ""
  Write-Output "NAO sobrescreva. Se esta e a chave que voce ja usou para publicar,"
  Write-Output "gerar outra por cima faz voce perder o app. Se tem certeza de que"
  Write-Output "esta e descartavel, apague o arquivo a mao e rode de novo."
  exit 1
}

Write-Output ""
Write-Output "Criando a chave de assinatura em:"
Write-Output "  $destino"
Write-Output ""

& $keytool -genkeypair -v `
  -keystore $destino `
  -alias nossopasso `
  -keyalg RSA -keysize 2048 -validity 10000

if (Test-Path $destino) {
  Write-Output ""
  Write-Output "Chave criada."
  Write-Output ""
  Write-Output "AGORA, ANTES DE QUALQUER OUTRA COISA:"
  Write-Output "  1. Copie $destino para um cofre de senhas ou nuvem privada."
  Write-Output "  2. Salve a senha no mesmo cofre, junto do arquivo."
  Write-Output "  3. So depois rode: powershell -File scripts\build-aab.ps1"
} else {
  throw "O keytool terminou sem criar o arquivo."
}
