
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

	// 4. "Mozek" chatbota - zde definujete odpovědi
	const getBotResponse = (userInput) => {
		const input = userInput.toLowerCase();

		if (input.includes("ahoj") || input.includes("dobrý den") || input.includes("zdravím")) {
			return "Dobrý den! Jsem online kariérový poradce. Jak vám mohu pomoci?";
		}

		if (input.includes("automechanik") || input.includes("mechanik")) {
			if (input.includes("nejlepší") || input.includes("nejvýhodnější")) {
				return "To záleží. Nabídka od firmy Auto a.s. má nejvyšší mzdu, ale u Servisu s.r.o. jsou lepší benefity. Podívejte se na obě v sekci 'Nabídky práce'.";
			}
			return "Ano, pro automechaniky máme několik nabídek. Najdete je všechny pohromadě v sekci 'Nabídky práce' na našem webu.";
		}

		if (input.includes("kuchař") || input.includes("kuchařka")) {
			return "Pro kuchaře aktuálně hledá například Hotel Zátiší. Požadují praxi 2 roky. Více informací a další nabídky najdete v sekci 'Nabídky práce'.";
		}

		if (input.includes("opravář") || input.includes("zemědělských")) {
			return "Pozice Opravář zemědělských strojů je stále volná u firmy AgroTech. Nabízejí i příspěvek na dopravu. Vše je v sekci 'Nabídky práce'.";
		}

		if (input.includes("kontakt") || input.includes("email") || input.includes("telefon") || input.includes("adresa")) {
			return "Všechny naše kontaktní údaje najdete na stránce 'Kontakt'. Můžete nám zavolat, napsat email nebo použít formulář.";
		}

		if (input.includes("služby") || input.includes("pomoc") || input.includes("životopis") || input.includes("cv")) {
			return "Nabízíme kariérní poradenství, pomoc s hledáním práce, tvorbu životopisů a přípravu na pohovory. Více je v sekci 'Služby'.";
		}

		if (input.includes("díky") || input.includes("děkuji")) {
			return "Rádo se stalo! Přeji hezký den.";
		}

		return "Omlouvám se, této otázce úplně nerozumím. Zkuste se zeptat na konkrétní pracovní pozici (např. 'automechanik') nebo na naše služby.";
	};
});
