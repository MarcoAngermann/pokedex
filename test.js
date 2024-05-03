let currentPokemon = [];
let searchedPokemon = [];
let allPokemon = [];
let allPokemonLoaded = false;
let currentCardIndex = 0;
console.log('test',allPokemon);
let offset = 0;
const limit = 25; // Anzahl der Pokémon, die gleichzeitig geladen werden sollen

async function init() {
    await loadPokemon(); // Die ersten 25 Pokemon laden
}

async function loadAllPokemon() {
    let url = `https://pokeapi.co/api/v2/pokemon?limit=154&offset=0`;
    let response = await fetch(url);
    let data = await response.json();
    allPokemon = data.results;

    let allPromises = [];
    for (let i = 0; i < allPokemon.length; i++) { // 1. Anfragen vorbereiten
        let pokemonUrl = allPokemon[i].url;
        allPromises.push(fetch(pokemonUrl));
    }

    let allPokemonResponses = await Promise.all(allPromises); // 2. Alles parallel ausführen

    for(let i = 0; i < allPokemonResponses.length; i++) { // 3. Auswerten 
        let pokemonResponse = allPokemonResponses[i];
        let pokemonData = await pokemonResponse.json();
        allPokemon[i] = pokemonData; 
    }

    console.log('Loaded all Pokémon', allPokemon);
}

async function loadPokemon() {
    let url = `https://pokeapi.co/api/v2/pokemon?limit=${limit}&offset=${offset}`; // Diese Funktion lädt nur eine begrenzte Anzahl von Pokémon, die dann in currentPokemon gespeichert werden
    let response = await fetch(url);
    let data = await response.json();
    let loadedPokemon = data.results;

    for (let i = 0; i < loadedPokemon.length; i++) { // Für jedes geladene Pokémon die vollständigen Daten abrufen und in currentPokemon speichern
        let pokemonUrl = loadedPokemon[i].url;
        let pokemonResponse = await fetch(pokemonUrl);
        let pokemonData = await pokemonResponse.json();
        currentPokemon.push(pokemonData);
    }

    console.log('Loaded Pokémon', currentPokemon);
    renderPokemonInfo();
    const loader = document.getElementById('loader');
    loader.style.display = 'none';
}

function extractStats(pokemon) {
    return pokemon.stats.map(stat => stat.base_stat);
}

async function pokemonStats(pokemonArray) {
    const statsArray = [];
    for (let i = 0; i < pokemonArray.length; i++) {
        const stats = extractStats(pokemonArray[i]);
        statsArray.push(stats);
    }
    return statsArray;
}

async function renderPokemonInfo(type) {
    const pokemonCardContainer = document.getElementById('pokemonCardContainer');
    pokemonCardContainer.innerHTML = '';
    if (type == 'search') {
        for (let i = 0; i < searchedPokemon.length; i++) {
            const pokemon = searchedPokemon[i];
            const pokemonName = capitalizeFirstLetter(pokemon.name);
            const typesHTML = generateTypesHTML(pokemon);
            const pokemonCardHTML = generatePokemonCardHTML(pokemon.types[0].type.name, pokemonName, pokemon.sprites.other.showdown.front_default, pokemon.name, typesHTML, i);
            pokemonCardContainer.innerHTML += pokemonCardHTML;
        }
    } else {
        for (let i = 0; i < currentPokemon.length; i++) {
            const pokemon = currentPokemon[i];
            const pokemonName = capitalizeFirstLetter(pokemon.name);
            const typesHTML = generateTypesHTML(pokemon);
            const pokemonCardHTML = generatePokemonCardHTML(pokemon.types[0].type.name, pokemonName, pokemon.sprites.other.showdown.front_default, pokemon.name, typesHTML, i);
            pokemonCardContainer.innerHTML += pokemonCardHTML;
        }
    }
    let statsArray;
    if (type == 'search') {
        statsArray = await pokemonStats(searchedPokemon);
    } else {
        statsArray = await pokemonStats(currentPokemon);
    }
    for (let i = 0; i < statsArray.length; i++) { // Rufe renderChart für jedes Pokémon auf
        renderChart(`myChart${i}`, statsArray[i]);
    }
}

function capitalizeFirstLetter(string) { // Funktion zum Großschreiben des ersten Buchstabens eines Strings
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function generateTypesHTML(pokemon) {
    let typesHTML = '';
    if (pokemon.types && pokemon.types.length > 0) { // Überprüfen, ob pokemon.types definiert und nicht leer ist
        for (let j = 0; j < pokemon.types.length; j++) {
            typesHTML += `<p class="${pokemon.types[j].type.name}">${pokemon.types[j].type.name}</p>`;
        }
    }
    return typesHTML;
}

function generatePokemonCardHTML(pokemonType, pokemonName, imageUrl, altText, typesHTML, index) { // Funktion zum Generieren des HTML-Codes für eine einzelne Pokémon-Karte
    return `
        <div onclick="showPokemonCard(${index})" class="pokeCard ${pokemonType}">
            <h1>${pokemonName}</h1>
            <img class="pokemonImage" src="${imageUrl}" alt="${altText}">
            <div class="types">
                ${typesHTML}
            </div>
            <div class="chartContainer">
                <canvas id="myChart${index}" ></canvas>
            </div>
        </div>
    `;
}

function loadMorePokemon() {
    const loader = document.getElementById('loader'); 
    if (loader.style.display !== 'flex') { // Überprüfe, ob der Ladebildschirm bereits angezeigt wird
        loader.style.display = 'flex'; // Wenn nicht, zeige den Ladebildschirm an
        offset += limit; // Erhöhe den Offset-Wert, um die nächsten Pokémon zu laden
        loadPokemon().then(() => {  // Lade die Pokémon und verstecke den Ladebildschirm, sobald das Laden abgeschlossen ist
            loader.style.display = 'none';
        });
    }
}

function showPokemonCard(index) {
    const selectedPokemon = currentPokemon[index];
    const pokemonName = selectedPokemon.name.charAt(0).toUpperCase() + selectedPokemon.name.slice(1);
    const showPokemonCardContainer = document.getElementById('showPokemonCardContainer');
    const pokemonType = selectedPokemon.types[0].type.name;
    showPokemonCardContainer.innerHTML = showPokemonCardHTML(pokemonType,selectedPokemon, pokemonName, index);
    showPokemonCardContainer.classList.add('d-block'); // Zeige den Container für die einzelne Pokémon-Karte
    document.body.style.overflow = 'hidden'; // Scrollbar deaktivieren
    renderChart(`myChart${index}`, selectedPokemon.stats.map(stat => stat.base_stat)); // Hier wird die renderChart-Funktion aufgerufen
}

function showPokemonCardHTML(pokemonType,selectedPokemon, pokemonName, index) {
    const typesHTML = generateTypesHTML(selectedPokemon); // Rufe generateTypesHTML auf, um typesHTML zu erhalten
    const chartCanvasID = `myChart${index}`;
    return `
        <div class="centerPokemonCard">
            <button class="closePokemonCardButton" onclick="closePokemonCard(${index})">CLOSE</button>
            <div class="pokeCardBig ${pokemonType}">
                <h1>${pokemonName}</h1>
                <img class="pokemonImageBig" src="${selectedPokemon.sprites.other.dream_world.front_default}">
                <div class="types">${typesHTML}</div>
                <canvas id="${chartCanvasID}" class="chartContainerBig"></canvas>
            </div>
            <div class="buttonContainer">
                <button class="changeCardButton" onclick="previousCard()">&#8592 PREV</button>
                <button class="changeCardButton" onclick="nextCard()">NEXT &#8594</button>
            </div>
        </div>
    `;
}

async function searchPokemon() {
    const searchInput = document.getElementById('searchPokemon').value.toLowerCase();
    const loader = document.getElementById('loader'); // Zeige den Loader an
    loader.style.display = 'flex';

    if (searchInput.length >= 3) {
        try {
            await loadAllPokemon(); // Alle Pokémon laden, wenn die Suchfunktion zum ersten Mal verwendet wird
            allPokemonLoaded = true;
            searchedPokemon = allPokemon.filter(pokemon => pokemon.name.toLowerCase().startsWith(searchInput));
            renderPokemonInfo('search');
        } catch (error) {
            console.error('Error loading Pokémon:', error);
        } finally {
            loader.style.display = 'none'; // Verstecke den Loader, wenn die Suche abgeschlossen ist
        }
    } else {
        renderPokemonInfo(); // Wenn die Länge des Suchbegriffs kleiner als 3 ist, zeige die ursprünglich geladenen Pokémon an
        loader.style.display = 'none'; // Verstecke den Loader, wenn die Suche abgeschlossen ist
    }
}

function closePokemonCard(i){
    const showPokemonCardContainer = document.getElementById('showPokemonCardContainer');
    showPokemonCardContainer.classList.remove('d-block');
    document.body.style.overflow = 'auto'; // Scrollbar wieder aktivieren
}

function previousCard() {
    if (currentCardIndex > 0) { // Überprüfen, ob es eine vorherige Karte gibt
        currentCardIndex--; // Den Index der aktuellen Karte um 1 verringern
    } else {
        currentCardIndex = currentPokemon.length - 1; // Falls der Index bereits 0 ist, zurück zum letzten Index (letztes Pokemon)
    }
    showCurrentCard();
}

function nextCard() {
    if (currentCardIndex < currentPokemon.length - 1) { // Überprüfen, ob es eine nächste Karte gibt
        currentCardIndex++; // Den Index der aktuellen Karte um 1 erhöhen
    } else {
        currentCardIndex = 0; // Falls der Index bereits das letzte Pokemon ist, zurück zum ersten Index (erstes Pokemon)
    }
    showCurrentCard();
}

function showCurrentCard() {
    showPokemonCard(currentCardIndex); // Zeige die Karte mit dem aktualisierten Index an
}








