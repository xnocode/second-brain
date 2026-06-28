FROM oven/bun:1

# Install compilers and runtimes
RUN apt-get update && apt-get install -y \
  gcc g++ python3 ruby default-jdk \
  && rm -rf /var/lib/apt/lists/*

# Install Rust
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
ENV PATH="/root/.cargo/bin:${PATH}"

# Install Go
RUN curl -OL https://go.dev/dl/go1.22.0.linux-amd64.tar.gz \
  && tar -C /usr/local -xzf go1.22.0.linux-amd64.tar.gz \
  && rm go1.22.0.linux-amd64.tar.gz
ENV PATH="/usr/local/go/bin:${PATH}"
ENV GOROOT="/usr/local/go"

WORKDIR /app
COPY package.json index.ts ./
RUN bun install

EXPOSE 3005
CMD ["bun", "index.ts"]