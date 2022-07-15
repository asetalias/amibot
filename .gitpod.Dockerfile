FROM gitpod/workspace-full:latest

COPY .nvmrc /tmp/.nvmrc

RUN bash -c 'VERSION="$(</tmp/.nvmrc)" \
    && source $HOME/.nvm/nvm.sh && nvm install $VERSION \
    && nvm use $VERSION && nvm alias default $VERSION'

RUN echo "nvm use default &>/dev/null" >> ~/.bashrc.d/51-nvm-fix
