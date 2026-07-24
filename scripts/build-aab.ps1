# Compila o AAB do Nosso Passo para a Play Store.
#
#   powershell -File scripts\build-aab.ps1
#
# Pede a senha da chave na hora e NAO a guarda em lugar nenhum: ela vive na
# memoria do processo e some quando ele termina. Nunca coloque a senha dentro
# deste arquivo, nem numa variavel de ambiente permanente.
#
# Pre-requisitos, ja instalados em %USERPROFILE%\.bubblewrap:
#   jdk\           JDK 17
#   android_sdk\   plataformas android-34 e android-36, build-tools 34.0.0 e 36.0.0
#
# A chave de assinatura NAO esta versionada e nao deve estar. Se ainda nao
# existir, crie uma unica vez (a senha e sua, escolhida por voce):
#
#   $env:JAVA_HOME = "$env:USERPROFILE\.bubblewrap\jdk"
#   & "$env:JAVA_HOME\bin\keytool.exe" -genkeypair -v `
#       -keystore twa\android-keystore.jks -alias nossopasso `
#       -keyalg RSA -keysize 2048 -validity 10000
#
# Guarde o .jks e a senha num cofre, COM COPIA. Perdidos, nao ha atualizacao do
# app nunca mais sob o pacote br.com.nossopasso.app.

$ErrorActionPreference = 'Stop'

$raiz = Split-Path -Parent $PSScriptRoot
$twa  = Join-Path $raiz 'twa'
$base = "$env:USERPROFILE\.bubblewrap"

if (-not (Test-Path "$base\jdk\bin\java.exe")) { throw "JDK nao encontrado em $base\jdk" }
if (-not (Test-Path "$twa\gradlew.bat"))       { throw "Projeto Android ausente. Rode: cd twa; bubblewrap update" }

$chave = Join-Path $twa 'android-keystore.jks'
if (-not (Test-Path $chave)) {
  throw "Chave de assinatura nao encontrada em $chave. Veja o cabecalho deste arquivo para criar."
}

Set-Location $twa
$env:JAVA_HOME    = "$base\jdk"
$env:ANDROID_HOME = "$base\android_sdk"

# 1) O diretorio do projeto entra no PATH porque o bubblewrap chama
#    `gradlew.bat` sem caminho, e o cmd nao procura no diretorio atual quando
#    NoDefaultCurrentDirectoryInExePath=1 (o caso de alguns ambientes).
# 2) O bin do JDK entra porque o `jarsigner`, que assina o AAB, mora la.
$env:PATH = "$twa;$base\jdk\bin;$env:PATH"

# Localizar o bubblewrap em vez de confiar no PATH: a pasta global do npm nao
# esta no PATH de todo mundo, e instalar um pacote global nao a acrescenta.
$bubblewrap = (Get-Command bubblewrap.cmd -ErrorAction SilentlyContinue).Source
if (-not $bubblewrap) {
  $prefixo = (& npm prefix -g 2>$null)
  if ($prefixo) { $candidato = Join-Path $prefixo 'bubblewrap.cmd' }
  if ($candidato -and (Test-Path $candidato)) { $bubblewrap = $candidato }
}
if (-not $bubblewrap) {
  $padrao = Join-Path $env:APPDATA 'npm\bubblewrap.cmd'
  if (Test-Path $padrao) { $bubblewrap = $padrao }
}
if (-not $bubblewrap) {
  throw "bubblewrap nao encontrado. Instale com: npm i -g @bubblewrap/cli"
}

$senha = Read-Host -Prompt 'Senha da chave de assinatura' -AsSecureString
$plano = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto(
  [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($senha))

try {
  $env:BUBBLEWRAP_KEYSTORE_PASSWORD = $plano
  $env:BUBBLEWRAP_KEY_PASSWORD      = $plano
  & $bubblewrap build --skipPwaValidation
} finally {
  # Some da memoria do processo aconteca o que acontecer.
  $plano = $null
  Remove-Item Env:BUBBLEWRAP_KEYSTORE_PASSWORD -ErrorAction SilentlyContinue
  Remove-Item Env:BUBBLEWRAP_KEY_PASSWORD -ErrorAction SilentlyContinue
  [System.GC]::Collect()
}

$aab = Join-Path $twa 'app-release-bundle.aab'
if (Test-Path $aab) {
  Write-Output ""
  Write-Output ("AAB pronto: {0}  ({1} KB)" -f $aab, [math]::Round((Get-Item $aab).Length / 1KB))
  Write-Output "Suba este arquivo no Play Console, em Teste fechado."
} else {
  throw "A compilacao terminou sem gerar o AAB."
}
