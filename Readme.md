# MiladyPoland

## Wprowadzenie
MiladyPoland wykorzystuje Cookie3 w celu stworzenia dynamicznego NFT z metadanymi zależnymi od różnych wydarzeń na chainie.

Projekt kierowany jest do entuzjastów Milady i do szerszego grona Web3 deweloperów.

## Koncept
Pierwsze 5 wymintowanych NFT jest stworzone dla pięciu zasłużonych deweloperów Web3 znanych w community Milady. Każdy z nich posiada trait który odzwierciedla ich datę dołączenia na Githuba ("Developer Since") i łączną ilość tzw. "contributions".

W przyszłości planowane jest otwarcie mintu kolejnych NFT dla osób które będą mogły podpiąć swojego Githuba i zmintować własne NFT poniekąd reprezentujące siebie. 

NFT posiada także trait "Remilia Score" który jest zależny od ilości posiadanych NFT z szerzej pojętego ekosystemu Remilii. Podczas fetchowania metadanych, backend calluje API Cookie3 aby sprawdzić ilość wszystkich NFT w posiadaniu użytkownika. Backend sprawdza potem które z tych NFT są z ekosystemu Remilii i na tej podstawie oblicza Remilia Score.

Dla przykładu: Użytkownik posiada na swoim portfelu 1 Milady i 2 Remilio. Jako że Milady jest warte 1 punkt, a Remilio 0.75, Remilia Score posiadacza NFT wynosi 2.5. Oczywiście przy zmianie właściciela danego NFT, Remilia Score również się zmienia. Podobna logika może być zastosowana przez inne projekty w celu sprawdzenia ilości posiadanych NFT z danego ekosystemu (BAYC i MAYC) i oferowania na podstawie tego wyniku różnych "experiences".

Jako inside-joke w Milady community, jeśli posiadacz NFT posiada na swoim portfelu także Bored Ape/Mutant Ape lub Nakamigos, automatycznie dostaje emotkę klauna 🤡 jako Remilia Score.

Kolejną cechą jest tzw. ewolucja NFT. Każdy NFT posiada trait "Evolution Stage" który jest zwiększany, jeżeli NFT zostanie sprzedany drożej niż najwyższa poprzednia sprzedaż. Jest to element gamifikacji, który również pozwala na obserwowanie jakie decyzje podejmują posiadacze NFT. Czy będą chcieli go zatrzymać dla siebie, ponieważ jest spersonalizowany, czy może sprzedadzą go dalej, aby zobaczyć jak będzie wyglądać kolejna wersja?

Dzięki powyższym rozwiązaniom, mamy nadzieję że posiadacze MiladyPoland będą mogli bardziej utożsamić się z własnym NFTkiem i zyskać bardziej speronalizowane doświadczenie.