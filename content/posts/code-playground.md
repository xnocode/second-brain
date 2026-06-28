---
title: "Code Playground"
date: 2025-06-28
tags: ["code", "features", "guide"]
category: "Guide"
draft: false
excerpt: "Run code in 24 languages directly inside your blog posts with the interactive playground."
cover: "/covers/code-playground.png"
---

Every code block with a supported language gets syntax highlighting and a **Run** button. Clicking Run executes the code and shows the output directly below the block. A **Copy** button is also included.

## How It Works

Write a standard fenced code block with the language identifier:

````markdown
```python
def fibonacci(n: int) -> list[int]:
    fib = [0, 1]
    for i in range(2, n):
        fib.append(fib[i - 1] + fib[i - 2])
    return fib[:n]

print(fibonacci(10))
```
````

On the website, this renders with Shiki syntax highlighting, a colored language badge (e.g., "Python" in blue), a Run button with a play icon, and a Copy button. When you click Run, the code executes and the output (`[0, 1, 1, 2, 3, 5, 8, 13, 21, 34]`) appears in a panel below the code.

Try clicking **Run** on the blocks below — the Input field is optional. If your code doesn't need input, just leave it empty and click Run.

```python
for i in range(1, 6):
    print(f"{i} x {i} = {i * i}")
```

```javascript
const squares = Array.from({length: 5}, (_, i) => (i + 1) ** 2);
console.log("Squares:", squares.join(", "));
```

```cpp
#include <iostream>
using namespace std;

int main() {
    for (int i = 1; i <= 5; i++) {
        cout << i << " squared = " << i * i << endl;
    }
    return 0;
}
```

All three run without any input — just click Run.

## Stdin Input Support

Some code needs user input. Every runnable code block includes an **Input (stdin)** textarea below the code. Type your input there before clicking Run.

For example, a Python program that reads a name:

```python
name = input("What is your name? ")
print(f"Hello, {name}!")
```

To test this:

1. Type `Alice` in the Input (stdin) field
2. Click **Run**
3. The output shows `What is your name? Hello, Alice!`

### Multi-line Input

For programs that need multiple inputs, put each value on its own line in the stdin field:

```python
a = int(input())
b = int(input())
print(f"Sum: {a + b}")
```

Type in the input field:
```
10
20
```

Click Run — output: `Sum: 30`

### How Stdin Works

- The input textarea is always visible below every runnable code block
- If the input field is empty, no stdin is sent (programs that don't need input work normally)
- If the input field has text, it's sent as stdin to the code runner
- Multi-line input is supported — each line becomes one `input()` call
- The stdin is sent all at once (buffered), not line by line with prompts

## Supported Languages (24)

| Language | Identifiers | Language | Identifiers |
|----------|------------|----------|-------------|
| Python | `python`, `py` | Java | `java` |
| JavaScript | `javascript`, `js` | TypeScript | `typescript`, `ts` |
| C | `c` | C++ | `cpp`, `c++` |
| Rust | `rust`, `rs` | Go | `go`, `golang` |
| Swift | `swift` | Kotlin | `kotlin`, `kt` |
| Scala | `scala` | Ruby | `ruby`, `rb` |
| PHP | `php` | Lua | `lua` |
| R | `r` | Bash | `bash`, `sh` |
| SQL | `sql` | HTML | `html` |
| CSS | `css` | JSON | `json` |
| YAML | `yaml` | Markdown | `markdown` |

Languages in this list get the Run button. Languages outside this list still get full syntax highlighting but without the Run button.

Note: The Run button actually executes code for the first 10 languages (Python through Go). The remaining 14 languages (Swift, Kotlin, Scala, etc.) show the Run button for UI consistency, but execution is limited to the languages installed on the server.

## Language Labels and Colors

Each language shows a colored badge above the code. For example:

- Python — blue badge
- JavaScript — yellow badge
- Rust — orange badge
- TypeScript — blue badge
- Java — orange badge
- Go — cyan badge

The color is automatic based on the language. No configuration needed.

## Output Panel

After clicking Run, a panel slides open below the stdin area showing:

- **stdout** — standard output in the default text color
- **stderr** — errors in red
- **Execution time** — how long the code took to run

The output panel has a close button and supports scrolling for long outputs.

## Multiple Code Blocks

You can have as many code blocks as you want in a single post. Each runs independently. Mix different languages in the same article:

````markdown
```javascript
// JavaScript example
console.log("Hello from JS");
```

```python
# Python example
print("Hello from Python")
```
````

Each block has its own Run button, stdin input, and output panel.

## What Readers See

When a reader visits your post, they see beautifully syntax-highlighted code blocks with a small input area and a Run button. They can type input values, click Run to see the output live, or Copy to grab the code. This turns documentation into an interactive reference — readers can verify examples work without leaving the page.

## Next Steps

- [[math-and-diagrams]] — Add LaTeX math and Mermaid diagrams.
- [[writing-posts]] — Wiki-links, task lists, PDF embeds, and more content features.
- [[audio-and-video]] — Embed audio players and YouTube/Vimeo videos.
- [[knowledge-graph]] — See how code playground posts connect to other articles.