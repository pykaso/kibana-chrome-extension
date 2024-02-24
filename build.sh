#!/bin/bash

uglifyjs ./Sources/main.js > ./Build/main.js
uglifyjs ./Sources/bg.js > ./Build/bg.js
cp  ./Sources/rison.js  ./Build/rison.js
cp ./Sources/icon.png  ./Build/icon.png
cp ./Sources/main.html  ./Build/main.html
cp ./Sources/manifest.json  ./Build/manifest.json

cd Build

# Název souboru manifestu
MANIFEST="./manifest.json"

# Získání verze z manifestu
VERSION=$(grep '"version":' $MANIFEST | head -1 | awk -F\" '{print $4}')

# Kontrola, zda byla verze nalezena
if [ -z "$VERSION" ]; then
    echo "Verze nebyla nalezena."
    exit 1
fi

# Vytvoření ZIP souboru
ZIP_NAME="../Dist/$VERSION.zip"

# Příkaz pro vytvoření zipu (předpokládá, že veškeré soubory rozšíření jsou v aktuálním adresáři)
zip -r $ZIP_NAME . -x "*.zip"

echo "Rozšíření verze $VERSION bylo zabaleno do souboru $ZIP_NAME."
