source $HOME/.aliases
eval "$(/opt/homebrew/bin/brew shellenv)"

export PYENV_ROOT="$HOME/.pyenv"
[[ -d $PYENV_ROOT/bin ]] && export PATH="$PYENV_ROOT/bin:$PATH"
eval "$(pyenv init -)"

export NVM_DIR="$HOME/.nvm"
  [ -s "/opt/homebrew/opt/nvm/nvm.sh" ] && \. "/opt/homebrew/opt/nvm/nvm.sh"  # This loads nvm
  [ -s "/opt/homebrew/opt/nvm/etc/bash_completion.d/nvm" ] && \. "/opt/homebrew/opt/nvm/etc/bash_completion.d/nvm"  # This loads nvm bash_completion

eval "$(pyenv init -)"
eval "$(pyenv virtualenv-init -)"
export PATH='/Users/alexismanuel/.duckdb/cli/latest':$PATH
export PATH="/opt/homebrew/opt/libpq/bin:$PATH"
export PATH="${KREW_ROOT:-$HOME/.krew}/bin:$PATH"
export PATH="/Users/alexismanuel/.local/bin:$PATH"
export PATH="$HOMEBREW_PREFIX/opt/coreutils/libexec/gnubin:$PATH"

export PYENV_VIRTUALENV_DISABLE_PROMPT=1
eval "$(starship init zsh)"
fastfetch

. "$HOME/.cargo/env"

# opencode
export PATH=/Users/alexismanuel/.opencode/bin:$PATH

# GPG
export GPG_TTY=$(tty)

# zoxide
eval "$(zoxide init zsh)"


# bun completions
[ -s "/Users/alexismanuel/.bun/_bun" ] && source "/Users/alexismanuel/.bun/_bun"

# bun
export BUN_INSTALL="$HOME/.bun"
export PATH="$BUN_INSTALL/bin:$PATH"
alias oc="opencode"

unalias br 2>/dev/null  # br installer - remove conflicting alias

# Pi tools
export PATH="$HOME/.pi/bin:$PATH"
