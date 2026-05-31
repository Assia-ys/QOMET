!macro customInstall
  nsExec::Exec 'netsh advfirewall firewall delete rule name="QOMET"'
  nsExec::Exec 'netsh advfirewall firewall add rule name="QOMET" dir=in action=allow protocol=TCP localport=7777 profile=private,domain'
  nsExec::Exec 'netsh advfirewall firewall add rule name="QOMET-UDP" dir=in action=allow protocol=UDP localport=7778 profile=private,domain'
!macroend

!macro customUninstall
  nsExec::Exec 'netsh advfirewall firewall delete rule name="QOMET"'
  nsExec::Exec 'netsh advfirewall firewall delete rule name="QOMET-UDP"'
!macroend
