Set WshShell = CreateObject("WScript.Shell")
Dim scriptDir
scriptDir = Left(WScript.ScriptFullName, InStrRev(WScript.ScriptFullName, "\"))

' Ejecutar launch.bat oculto (la ventana de Electron se abre sola)
WshShell.Run """" & scriptDir & "scripts\launch.bat""", 0, False
