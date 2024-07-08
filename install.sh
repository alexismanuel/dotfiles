#!/usr/bin/env sh
git clone --bare git@github.com:alexismanuel/dotfiles.git $HOME/.dotfiles
function dotfiles {
   git --git-dir=$HOME/.dotfiles/ --work-tree=$HOME $@
}

mkdir -p .dotfiles-backup
dotfiles checkout
if [ $? = 0 ]; then
  echo "Checked out dotfiles from git@github.com:alexismanuel/dotfiles.git";
  else
    echo "Moving existing dotfiles to ~/.dotfiles-backup";
    config checkout 2>&1 | egrep "\s+\." | awk {'print $1'} | xargs -I{} mv {} .dotfiles-backup/{}
fi

dotfiles checkout
dotfiles config status.showUntrackedFiles no
