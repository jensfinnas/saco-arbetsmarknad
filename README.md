# Saco arbetsmarknad

Det här är en visualisering som visar den aktuella arbetslösheten bland akademikerna. Appen består av:

1) En dashboard med den totala arbetslösheten och skärningar på kön, utbildning m.m.
2) En grafbyggare (/chartbuilder.html) för att generera grafer på samma data för inbäddning.

Dashboard: http://makingwaves-se-us.github.io/saco-arbetsmarknad/
Grafbyggaren: http://makingwaves-se-us.github.io/saco-arbetsmarknad/chartbuilder.html

### Data

Data ligger i ett Google spreadsheetet (https://docs.google.com/spreadsheets/d/1I7A8rydoRA6n28W6Tnt6nCpEYeUbI2J1dcVrEy54G7Y/edit#gid=0) som synkas till Amazon S3.

Använd `Sync > Update preview/visualization` för att uppdatera grafiken.

### Utveckla

Starta server:

	grunt serve --force

### Deploy

För att bygga och pusha till Github:

	sh deploy.sh

### Felsökning

##### Problem: Det går inte att uppdatera Google-arket

Lösning. Försök starta om appen `tabletop-proxy` med.

	heroku restart
