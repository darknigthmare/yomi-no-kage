from pathlib import Path

from PIL import Image


ROOTS = [
    Path("assets/modular/environments"),
]


def is_chroma(pixel):
    r, g, b, a = pixel
    return a > 0 and r > 220 and g < 55 and b > 190


def clean_image(path):
    image = Image.open(path).convert("RGBA")
    pixels = list(image.getdata())
    changed = 0
    cleaned = []
    for pixel in pixels:
        if is_chroma(pixel):
            cleaned.append((pixel[0], pixel[1], pixel[2], 0))
            changed += 1
        else:
            cleaned.append(pixel)
    if not changed:
        return 0
    image.putdata(cleaned)
    image.save(path)
    return changed


def main():
    total = 0
    files = 0
    for root in ROOTS:
        for path in root.rglob("*.png"):
            if "source" in path.parts:
                continue
            changed = clean_image(path)
            if changed:
                files += 1
                total += changed
                print(f"cleaned {changed} px: {path}")
    print(f"cleaned_files={files} cleaned_pixels={total}")


if __name__ == "__main__":
    main()
