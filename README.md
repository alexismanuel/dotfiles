# dotfiles
my dotfiles

## System dependencies
- [pipx](https://github.com/pypa/pipx?tab=readme-ov-file#on-linux)
- wezterm, both [windows](https://github.com/wez/wezterm/releases/download/20240203-110809-5046fc22/WezTerm-20240203-110809-5046fc22-setup.exe) and [wsl](https://wezfurlong.org/wezterm/install/linux.html#using-the-apt-repo) for smart splits
- [git](https://git-scm.com/download/linux)
- [pyenv](curl https://pyenv.run | bash) (with python versions 3.9 up to 3.12))
- [poetry](https://python-poetry.org/docs/#installation)
- [JetBrainsMono Font](https://github.com/ryanoasis/nerd-fonts/releases/download/v3.2.1/JetBrainsMono.zip)
- [nvim](https://github.com/neovim/neovim/blob/master/INSTALL.md#ubuntu)
- [docker](https://docs.docker.com/desktop/install/windows-install/)
- [cookiecutter](https://github.com/cookiecutter/cookiecutter?tab=readme-ov-file#installation)
- [starship](https://github.com/starship/starship?tab=readme-ov-file#-installation)
- [fastfetch](https://github.com/fastfetch-cli/fastfetch?tab=readme-ov-file#installation)
- [rustup](https://rustup.rs/)


## Install
```bash
curl https://raw.githubusercontent.com/alexismanuel/dotfiles/master/install.sh | bash
```

## Specific Configs

### Wezterm
Shared config for both Windows / Linux:
- Windows file location: `/mnt/c/Users/<user>/.wezterm.lua`
- Linux file location: `~/.wezterm.lua`
