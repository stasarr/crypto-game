document.addEventListener('DOMContentLoaded', () => {
    const inputs = document.querySelectorAll('.letter-input');
    const jokerButton = document.getElementById('jokerButton');
    const submitButton = document.getElementById('submitButton');
    let jokerCount = 3;
    let selectedInput = null;
    let mistakeCount = 0;
    const mistakeMap = new Map(); // Hangi inputta hata yapıldığını takip eder

    // Input geçişleri
    inputs.forEach((input, idx) => {
        input.addEventListener('focus', () => {
            input.select();
        });

        input.addEventListener('input', (e) => {
            const value = e.target.value.toLowerCase();
            const correctAnswer = input.dataset.answer.toLowerCase();

            if (value.match(/[a-zA-ZğüşıöçĞÜŞİÖÇ]/)) {
                if (value === correctAnswer) {
                    input.classList.remove('incorrect');
                    input.classList.add('correct');
                } else {
                    input.classList.remove('correct');
                    input.classList.add('incorrect');

                    // Bu input için daha önce hata sayılmamışsa bir kez say
                    if (!mistakeMap.has(idx)) {
                        mistakeCount++;
                        mistakeMap.set(idx, true);
                    }
                }

                if (idx + 1 < inputs.length) {
                    inputs[idx + 1].focus();
                }
            } else {
                input.value = '';
                input.classList.remove('correct', 'incorrect');
            }
        });

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && input.value === '' && idx > 0) {
                inputs[idx - 1].focus();
            }
        });

        input.addEventListener('click', () => {
            if (selectedInput && selectedInput !== input) {
                selectedInput.classList.remove('joker-target');
            }
            selectedInput = input;
            input.classList.add('joker-target');
        });
    });

    // Joker sistemi
    jokerButton.addEventListener('click', () => {
        if (jokerCount > 0 && selectedInput) {
            const index = parseInt(selectedInput.dataset.index);
            const selectedChar = originalLetters[index].char.toLowerCase();

            // Bu harf zaten ipucu olarak verildiyse engelle
            const isClue = clueLetters.some(
                clue => clue.original.toLowerCase() === selectedChar
            );

            if (isClue) {
                alert("Bu harf zaten ipucu olarak verildi!");
                return;
            }

            fetch(`/game/use-joker`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ index })
            })
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        selectedInput.value = data.letter;
                        selectedInput.classList.add('correct');
                        selectedInput.disabled = true;
                        jokerCount--;
                        document.getElementById('jokerCount').textContent = jokerCount;
                    }
                });
        }
    });


    // Cevabı gönder
    submitButton.addEventListener('click', () => {
        const letters = Array.from(inputs).map(input => input.value);
        const usedJokers = 3 - parseInt(document.getElementById('jokerCount')?.textContent || "3");

        fetch('/game/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                answers: letters,
                usedJokers,
                mistakes: mistakeCount // yanlış giriş sayısı burada
            })
        })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    alert("Tebrikler! Bir sonraki seviyeye geçiyorsunuz.");
                    window.location.href = data.nextLevelUrl || '/game';
                } else {
                    alert("Bazı harfler yanlış. Lütfen tekrar deneyin.");
                    if (data.wrongIndices) {
                        data.wrongIndices.forEach(index => {
                            inputs[index].classList.remove('correct');
                            inputs[index].classList.add('incorrect');
                        });
                    }
                }
            });
    });
});
