#!/usr/bin/env sh
git clone --bare git@github.com:alexismanuel/dotfiles.git $HOME/.dotfiles
function df {
   git --git-dir=$HOME/.dotfiles/ --work-tree=$HOME $@
}

mkdir -p .dotfiles-backup
df checkout
if [ $? = 0 ]; then
  echo "Checked out dotfiles from git@github.com:alexismanuel/dotfiles.git";
  else
    echo "Moving existing dotfiles to ~/.dotfiles-backup";
    df checkout 2>&1 | egrep "\s+\." | awk {'print $1'} | xargs -I{} mv {} .dotfiles-backup/{}
fi

df checkout
df config status.showUntrackedFiles no
