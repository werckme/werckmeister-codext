# Octave Transpose Selection

- STATUS: CLOSED
- PRIORITY: 100
- TAGS: Feature
  
Die VSCode Extension soll um eine Funktion erweitert werden, bei der man ein Stück Werckmeister Code selektiert, command menu aufruft, "transpose selection one octave up/down"  aufruft.
 
Je nach Antwort werden die ausgewählten Noten Events eine octave nach oben oder unten transponiert.
 
Z.B.: aus "c" wird "c'" oder "c,", aus "I" wird "I'" oder "I,"
 
Diese Funktion ist per automatischen Test abgesichert für mindestens folgende Fälle:
 
* mehrere Takte
* mehrere Zeilen
* zwischen zwei Voices:
 
```
[ 
{ 
 -- Auswahl von hier
 events
} 
{ 
  events
  -- Nach hier
} 
] 
```
 
* gemischte Events
  * Lautstärke
  * Meta Events (/cc: .../)
* events mit Tags ("myTag"@I)
* Octav Grenzen
  * ist ober oder untergrenze erreicht, wird die entsprechende Note übersprungen
  
  
