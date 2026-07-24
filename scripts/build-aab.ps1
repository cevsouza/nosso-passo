# Compila e assina o AAB do Nosso Passo para a Play Store.
#
#   powershell -ExecutionPolicy Bypass -File scripts\build-aab.ps1
#
# Faz as duas etapas na mao, sem passar pelo bubblewrap:
#   1. gradlew bundleRelease  -> AAB nao assinado
#   2. jarsigner              -> AAB assinado
#
# E o mesmo que o `bubblewrap build` faz, com uma diferenca que importa: TODOS
# os caminhos aqui sao absolutos e conferidos antes de comecar. O bubblewrap
# depende da pasta global do npm estar no PATH, o que nao acontece em toda
# maquina — e instalar um pacote global nao a acrescenta.
#
# A senha e pedida na hora e vai para o jarsigner por VARIAVEL DE AMBIENTE
# (-storepass:env), nunca pela linha de comando: argumento de processo e
# visivel para qualquer programa que liste os processos da maquina.
#
# Pre-requisitos:
#   %USERPROFILE%\.bubblewrap\jdk           JDK 17
#   %USERPROFILE%\.bubblewrap\android_sdk   plataformas android-34 e 36
#   twa\android-keystore.jks                sua chave (scripts\criar-chave.ps1)

$ErrorActionPreference = 'Stop'

$raiz = Split-Path -Parent $PSScriptRoot
$twa  = Join-Path $raiz 'twa'
$base = Join-Path $env:USERPROFILE '.bubblewrap'

$jdk       = Join-Path $base 'jdk'
$sdk       = Join-Path $base 'android_sdk'
$jarsigner = Join-Path $jdk 'bin\jarsigner.exe'
$gradlew   = Join-Path $twa 'gradlew.bat'
$chave     = Join-Path $twa 'android-keystore.jks'
$naoAssin  = Join-Path $twa 'app\build\outputs\bundle\release\app-release.aab'
$assinado  = Join-Path $twa 'app-release-bundle.aab'

# Conferir tudo ANTES de pedir a senha: se faltar alguma coisa, o erro aparece
# sem custar a digitacao.
$faltando = @()
if (-not (Test-Path $jdk))       { $faltando += "JDK em $jdk" }
if (-not (Test-Path $sdk))       { $faltando += "Android SDK em $sdk" }
if (-not (Test-Path $jarsigner)) { $faltando += "jarsigner em $jarsigner" }
if (-not (Test-Path $gradlew))   { $faltando += "projeto Android em $twa (rode: cd twa; bubblewrap update)" }
if (-not (Test-Path $chave))     { $faltando += "chave em $chave (rode: scripts\criar-chave.ps1)" }
if ($faltando.Count -gt 0) {
  Write-Output ""
  Write-Output "Faltando:"
  $faltando | ForEach-Object { Write-Output "  - $_" }
  throw "Pre-requisitos ausentes."
}

$env:JAVA_HOME    = $jdk
$env:ANDROID_HOME = $sdk

Write-Output ""
Write-Output "1/2  Compilando o AAB..."
Push-Location $twa
try {
  # Chamado por caminho absoluto de proposito: o cmd nao procura no diretorio
  # atual quando NoDefaultCurrentDirectoryInExePath=1, e ai um `gradlew.bat`
  # solto falha com "nao e reconhecido" mesmo estando ali.
  & cmd /c "`"$gradlew`" bundleRelease --quiet"
  if ($LASTEXITCODE -ne 0) { throw "gradle falhou (codigo $LASTEXITCODE)" }
} finally {
  Pop-Location
}

if (-not (Test-Path $naoAssin)) { throw "o gradle terminou sem gerar $naoAssin" }
Write-Output ("     AAB nao assinado: {0} KB" -f [math]::Round((Get-Item $naoAssin).Length / 1KB))

Write-Output ""
Write-Output "2/2  Assinando..."
$senha = Read-Host -Prompt '     Senha da chave' -AsSecureString
$bstr  = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($senha)

try {
  $env:NP_STOREPASS = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($bstr)
  if (Test-Path $assinado) { Remove-Item $assinado -Force }

  & $jarsigner -sigalg SHA256withRSA -digestalg SHA-256 `
      -keystore $chave `
      -storepass:env NP_STOREPASS -keypass:env NP_STOREPASS `
      -signedjar $assinado $naoAssin nossopasso

  if ($LASTEXITCODE -ne 0) { throw "jarsigner falhou (codigo $LASTEXITCODE). Senha errada?" }
} finally {
  # A senha some da memoria do processo aconteca o que acontecer.
  [System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
  Remove-Item Env:NP_STOREPASS -ErrorAction SilentlyContinue
  [System.GC]::Collect()
}

if (-not (Test-Path $assinado)) { throw "a assinatura terminou sem gerar o arquivo." }

Write-Output ""
Write-Output ("AAB assinado: {0}" -f $assinado)
Write-Output ("              {0} KB" -f [math]::Round((Get-Item $assinado).Length / 1KB))
Write-Output ""
Write-Output "Suba este arquivo no Play Console, em Teste fechado."
