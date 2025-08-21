let currentPokemon = [];
let searchedPokemon = [];
let allPokemon = [];
let allPokemonLoaded = false;
let currentCardIndex = 0;
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
}

async function loadPokemon() {
    let url = `https://pokeapi.co/api/v2/pokemon?limit=${limit}&offset=${offset}`;
    let response = await fetch(url);
    let data = await response.json();
    let loadedPokemon = data.results;
    await fetchAndStorePokemonData(loadedPokemon);
    console.log('Loaded Pokémon', currentPokemon);
    renderPokemonInfo();
    const loader = document.getElementById('loader');
    loader.style.display = 'none';
}

async function fetchAndStorePokemonData(pokemonList) {
    for (let i = 0; i < pokemonList.length; i++) {
        let pokemonUrl = pokemonList[i].url;
        let pokemonResponse = await fetch(pokemonUrl);
        let pokemonData = await pokemonResponse.json();
        currentPokemon.push(pokemonData);
    }
}

function extractStats(pokemon) {
    return pokemon.stats.map(stat => stat.base_stat);
}

function pokemonStats(pokemonArray) {
    const statsArray = [];
    for (let i = 0; i < pokemonArray.length; i++) {
        const stats = extractStats(pokemonArray[i]);
        statsArray.push(stats);
    }
    return statsArray;
}

function renderPokemonInfo(type) {
    const pokemonCardContainer = document.getElementById('pokemonCardContainer');
    pokemonCardContainer.innerHTML = '';
    const pokemons = type === 'search' ? searchedPokemon : currentPokemon;
    for (let i = 0; i < pokemons.length; i++) {
        renderPokemonCard(pokemonCardContainer, pokemons[i], i, type);
    }
}

function renderPokemonCard(container, pokemon, index) {
    const pokemonName = capitalizeFirstLetter(pokemon.name);
    const typesHTML = generateTypesHTML(pokemon);
    const pokemonCardHTML = generatePokemonCardHTML(pokemon.types[0].type.name, pokemonName, pokemon.sprites.other.dream_world.front_default, pokemon.name, typesHTML, index);
    container.innerHTML += pokemonCardHTML;
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

// Füge ein Event-Listener für das Scrollen hinzu
window.addEventListener('scroll', () => {
    // Überprüfe, ob der Benutzer zum unteren Rand der Seite gescrollt hat
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight) {
        // Wenn ja, lade mehr Pokémon
        loadMorePokemon();
    }
});

function showPokemonCard(index) {
    let selectedPokemon;
    if (searchedPokemon.length > 0) {
        selectedPokemon = searchedPokemon[index];
    } else {
        selectedPokemon = currentPokemon[index];
    }
    
    if (!selectedPokemon) {
        return; // Fehlerbehandlung, falls das ausgewählte Pokemon nicht gefunden wird
    }
    
    const pokemonName = selectedPokemon.name.charAt(0).toUpperCase() + selectedPokemon.name.slice(1);
    const showPokemonCardContainer = document.getElementById('showPokemonCardContainer');
    const pokemonType = selectedPokemon.types[0].type.name;
    const pokemonArray = searchedPokemon.length > 0 ? searchedPokemon : currentPokemon;
    const pokemonIndex = pokemonArray.indexOf(selectedPokemon); // Index im entsprechenden Array finden
    showPokemonCardContainer.innerHTML = showPokemonCardHTML(pokemonType, selectedPokemon, pokemonName, pokemonIndex);
    showPokemonCardContainer.classList.add('d-block');
    document.body.style.overflow = 'hidden';
    renderChart(`myChart${pokemonIndex}`, selectedPokemon.stats.map(stat => stat.base_stat));
}


function showPokemonCardHTML(pokemonType,selectedPokemon, pokemonName, index) {
    const typesHTML = generateTypesHTML(selectedPokemon); // Rufe generateTypesHTML auf, um typesHTML zu erhalten
    const chartCanvasID = `myChart${index}`;
    return `
        <div class="centerPokemonCard">
            
            <div class="pokeCardBig ${pokemonType}">
                <div class="buttonContainer">
                    <button class="changeCardButton" onclick="previousCard()">&#8592 </button>
                    <button class="closePokemonCardButton" onclick="closePokemonCard(${index})">&#10005;</button>
                    <button class="changeCardButton" onclick="nextCard()"> &#8594</button>
                </div>
                <h1>${pokemonName}</h1>
                <div class="pokemonImageContainer">
                <img class="pokemonImageBig" src="${selectedPokemon.sprites.other.showdown.front_default}">
                </div>
                <div class="types">${typesHTML}</div>
                <canvas id="${chartCanvasID}" class="chartContainerBig">
                </canvas>
            </div>
         
        </div>
    `;
}

async function searchPokemon() {
    const searchInput = document.getElementById('searchPokemon').value.toLowerCase();
    const loader = document.getElementById('loader');
    loader.style.display = 'flex';
    if (searchInput.length >= 3) {
        try {
            await loadAllPokemon();
            allPokemonLoaded = true;
            searchedPokemon = allPokemon.filter(pokemon => pokemon.name.toLowerCase().startsWith(searchInput));
            renderPokemonInfo('search');
        } catch (error) {
            console.error('Error loading Pokémon:', error);
        } finally {
            loader.style.display = 'none';
        }
    } else {
        searchedPokemon = []; // Zurücksetzen des searchedPokemon-Arrays, wenn die Suche gelöscht wird
        renderPokemonInfo();
        loader.style.display = 'none';
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







