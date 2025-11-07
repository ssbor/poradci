// Počká, až se načte celá stránka
document.addEventListener("DOMContentLoaded", () => {

	// Najde potřebné HTML elementy
	const chatTrigger = document.getElementById("chat-trigger");
	const chatWindow = document.getElementById("chat-window");
	const chatMessages = document.getElementById("chat-messages");
	const chatInput = document.getElementById("chat-input-field");
	const chatSendButton = document.getElementById("chat-send-btn");

	// 1. Přepínání viditelnosti okna
	chatTrigger.addEventListener("click", () => {
		if (chatWindow.style.display === "none" || chatWindow.style.display === "") {
			chatWindow.style.display = "flex";
			// Uvítací zpráva, pokud je chat prázdný
			if (chatMessages.children.length === 0) {
				addMessageToChat("Dobrý den! Jsem online kariérový poradce. Zeptejte se mě třeba na nabídky práce pro kuchaře nebo automechanika.", "bot");
			}
		} else {
			chatWindow.style.display = "none";
		}
	});

	// 2. Funkce pro odeslání zprávy (tlačítkem nebo Enterem)
	const sendMessage = () => {
		const messageText = chatInput.value.trim();
		if (messageText === "") return; // Neodesílat prázdné zprávy

		// Přidá zprávu uživatele do chatu
		addMessageToChat(messageText, "user");
		chatInput.value = ""; // Vyčistí vstupní pole

		// Získá odpověď od bota (s malým zpožděním, aby to vypadalo reálněji)
		setTimeout(() => {
			const botResponse = getBotResponse(messageText);
			addMessageToChat(botResponse, "bot");
		}, 1000);
	};

	// Odeslání kliknutím na tlačítko
	chatSendButton.addEventListener("click", sendMessage);

	// Odeslání stisknutím klávesy Enter
	chatInput.addEventListener("keydown", (event) => {
		if (event.key === "Enter") {
			sendMessage();
		}
	});

	// 3. Funkce pro přidání zprávy do okna
	const addMessageToChat = (text, sender) => {
		const messageElement = document.createElement("div");
		messageElement.classList.add("chat-message", sender);
		messageElement.textContent = text;
		chatMessages.appendChild(messageElement);

		// Automaticky odroluje na poslední zprávu
		chatMessages.scrollTop = chatMessages.scrollHeight;
	};

	// 4. "Mozek" chatbota - ODPOVĚDI UPRAVENÉ PRO TVŮJ WEB
	const getBotResponse = (userInput) => {
		const input = userInput.toLowerCase(); // Převod na malá písmena pro snadnější porovnání

		// Přivítání
		if (input.includes("ahoj") || input.includes("dobrý den") || input.includes("zdravím")) {
			return "Dobrý den! Jsem online kariérový poradce. Můžete se mě zeptat na konkrétní pracovní nabídky.";
		}

		// Automechanik
		if (input.includes("automechanik") || input.includes("mechanik")) {
			return "Ano, pro automechaniky máme několik nabídek. Najdete je všechny pohromadě, když sjedete dolů na modrou sekci 'Automechanik' a podíváte se do tabulky.";
		}

		// Kuchař nebo číšník
		if (input.includes("kuchař") || input.includes("kuchařka") || input.includes("číšník") || input.includes("servírka")) {
			return "Nabídky pro kuchaře a číšníky najdete v červené sekci 'Kuchař‑číšník'. Stačí sjet dolů a podívat se do tabulky.";
		}

		// Opravář zemědělských strojů
		if (input.includes("opravář") || input.includes("zemědělských") || input.includes("agri")) {
			return "Ano, podívejte se prosím do zelené sekce 'Opravář zemědělských strojů'. V tabulce najdete všechny aktuální nabídky.";
		}
		
		// Dotaz na zahraničí
		if (input.includes("zahraničí") || input.includes("německo")) {
			return "Ano, máme nabídky i ze zahraničí (Německo). U každé kategorie (Automechanik, Opravář...) najdete filtr, kde stačí přepnout na 'Zahraničí (do 70km od Boru)' a zobrazí se vám.";
		}

		// Kontakt (předpokládám, že na stránce není)
		if (input.includes("kontakt") || input.includes("email") || input.includes("telefon") || input.includes("adresa")) {
			return "Omlouvám se, na této ukázkové stránce nemám k dispozici kontaktní údaje. Jsem jen chatbot pro demonstraci nabídek práce.";
		}

		// Služby (předpokládám, že na stránce nejsou)
		if (input.includes("služby") || input.includes("pomoc") || input.includes("životopis") || input.includes("cv")) {
			return "Mojí hlavní funkcí je ukazovat vám přehled pracovních nabídek. Pro specifické služby jako tvorba CV se prosím obraťte přímo na kariérního poradce.";
		}

		// Poděkování
		if (input.includes("díky") || input.includes("děkuji")) {
			return "Rádo se stalo! Přeji hezký den.";
		}

		// Výchozí odpověď (když nerozumí)
		return "Omlouvám se, této otázce úplně nerozumím. Zkuste se zeptat na konkrétní pracovní pozici (např. 'automechanik') nebo na nabídky v zahraničí.";
	};

});
