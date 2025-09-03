let currentPokemon = [];
let searchedPokemon = [];
let allPokemon = [];
let allPokemonLoaded = false;
let currentCardIndex = 0;
let offset = 0;
const limit = 25;

async function init() {
    await loadPokemon();
}

async function loadAllPokemon() {
    let url = `https://pokeapi.co/api/v2/pokemon?limit=154&offset=0`;
    let response = await fetch(url);
    let data = await response.json();
    allPokemon = data.results;
    let allPromises = allPokemon.map(p => fetch(p.url).then(res => res.json()));
    let allPokemonData = await Promise.all(allPromises);
    allPokemon = allPokemonData;
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
    const promises = pokemonList.map(p => fetch(p.url).then(res => res.json()));
    const results = await Promise.all(promises);
    currentPokemon.push(...results);
}

function extractStats(pokemon) {
    return pokemon.stats.map(stat => stat.base_stat);
}

function pokemonStats(pokemonArray) {
    return pokemonArray.map(p => extractStats(p));
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
    const imageUrl = pokemon.sprites.other.dream_world.front_default || pokemon.sprites.front_default;
    const pokemonCardHTML = generatePokemonCardHTML(pokemon.types[0].type.name, pokemonName, imageUrl, pokemon.name, typesHTML, index);
    container.innerHTML += pokemonCardHTML;
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function generateTypesHTML(pokemon) {
    let typesHTML = '';
    if (pokemon.types && pokemon.types.length > 0) {
        for (let j = 0; j < pokemon.types.length; j++) {
            typesHTML += `<p class="${pokemon.types[j].type.name}">${pokemon.types[j].type.name}</p>`;
        }
    }
    return typesHTML;
}

function generatePokemonCardHTML(pokemonType, pokemonName, imageUrl, altText, typesHTML, index) {
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
    if (loader.style.display !== 'flex') {
        loader.style.display = 'flex';
        offset += limit;
        loadPokemon().then(() => {
            loader.style.display = 'none';
        });
    }
}

// Früheres Scroll-Triggering für flüssigeres Laden
window.addEventListener('scroll', () => {
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 300) {
        loadMorePokemon();
    }
});

function showPokemonCard(index) {
    let selectedPokemon = searchedPokemon.length > 0 ? searchedPokemon[index] : currentPokemon[index];
    if (!selectedPokemon) return;

    const pokemonName = capitalizeFirstLetter(selectedPokemon.name);
    const showPokemonCardContainer = document.getElementById('showPokemonCardContainer');
    const pokemonType = selectedPokemon.types[0].type.name;
    const pokemonArray = searchedPokemon.length > 0 ? searchedPokemon : currentPokemon;
    const pokemonIndex = pokemonArray.indexOf(selectedPokemon);
    showPokemonCardContainer.innerHTML = showPokemonCardHTML(pokemonType, selectedPokemon, pokemonName, pokemonIndex);
    showPokemonCardContainer.classList.add('d-block');
    document.body.style.overflow = 'hidden';
    renderChart(`myChart${pokemonIndex}`, selectedPokemon.stats.map(stat => stat.base_stat));
}

function showPokemonCardHTML(pokemonType, selectedPokemon, pokemonName, index) {
    const typesHTML = generateTypesHTML(selectedPokemon);
    const chartCanvasID = `myChart${index}`;
    const imageUrl = selectedPokemon.sprites.other.showdown.front_default || selectedPokemon.sprites.front_default;
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
                    <img class="pokemonImageBig" src="${imageUrl}">
                </div>
                <div class="types">${typesHTML}</div>
                <canvas id="${chartCanvasID}" class="chartContainerBig"></canvas>
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
            if (!allPokemonLoaded) {
                await loadAllPokemon();
                allPokemonLoaded = true;
            }
            searchedPokemon = allPokemon.filter(pokemon => pokemon.name.toLowerCase().startsWith(searchInput));
            renderPokemonInfo('search');
        } catch (error) {
            console.error('Error loading Pokémon:', error);
        } finally {
            loader.style.display = 'none';
        }
    } else {
        searchedPokemon = [];
        renderPokemonInfo();
        loader.style.display = 'none';
    }
}

function closePokemonCard(i) {
    const showPokemonCardContainer = document.getElementById('showPokemonCardContainer');
    showPokemonCardContainer.classList.remove('d-block');
    document.body.style.overflow = 'auto';
}

function previousCard() {
    currentCardIndex = currentCardIndex > 0 ? currentCardIndex - 1 : currentPokemon.length - 1;
    showCurrentCard();
}

function nextCard() {
    currentCardIndex = currentCardIndex < currentPokemon.length - 1 ? currentCardIndex + 1 : 0;
    showCurrentCard();
}

function showCurrentCard() {
    showPokemonCard(currentCardIndex);
}







