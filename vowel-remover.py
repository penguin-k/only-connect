import re
import clipboard

def anti_vowel(s):
    result = re.sub(r'[AEIOU]', '', s, flags=re.IGNORECASE)
    return result
while True:
    answer = anti_vowel(input("Enter the string: ")).upper()
    print(answer)
    clipboard.copy(answer)
    print("")
