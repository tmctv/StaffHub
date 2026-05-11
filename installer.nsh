!macro customWelcomePage
  !define MUI_WELCOMEPAGE_TITLE "Welcome to TMC StaffHub Setup"
  !define MUI_WELCOMEPAGE_TEXT "This wizard will install TMC StaffHub Portal v1.0.0 on your computer.$\r$\n$\r$\nTMC StaffHub is the official staff management portal for The Mishra Corporation. Features include:$\r$\n$\r$\n    $(BULLET) Staff clock-in and clock-out$\r$\n    $(BULLET) Real-time activity monitoring$\r$\n    $(BULLET) Integrated Cirya Radio player$\r$\n    $(BULLET) Live stream metadata$\r$\n$\r$\nClick Next to continue."
!macroend

!macro customFinishPage
  !define MUI_FINISHPAGE_TITLE "TMC StaffHub Installed"
  !define MUI_FINISHPAGE_TEXT "TMC StaffHub Portal has been successfully installed on your computer.$\r$\n$\r$\nClick Finish to close the installer."
  !define MUI_FINISHPAGE_RUN "$INSTDIR\TMC StaffHub.exe"
  !define MUI_FINISHPAGE_RUN_TEXT "Launch TMC StaffHub"
  !define MUI_FINISHPAGE_LINK "Visit tmc.gg"
  !define MUI_FINISHPAGE_LINK_LOCATION "https://tmc.gg"
!macroend
