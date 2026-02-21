Team members default workspace setups

- Initialize & Set Frontend Team View
  git sparse-checkout init --cone
  git sparse-checkout set .github frontend

- Frontend Shell Team View
  git sparse-checkout init --cone
  git sparse-checkout set .github frontend/apps/shell frontend/public frontend/libs frontend/package.json frontend/package-lock.json frontend/next.config.js

- Auth Team View
  git sparse-checkout init --cone
  git sparse-checkout set .github frontend/apps/auth frontend/libs frontend/package.json frontend/package-lock.json

- Feed & Profile Team View
  git sparse-checkout init --cone
  git sparse-checkout set .github frontend/apps/feed frontend/apps/profile frontend/libs frontend/package.json frontend/package-lock.json

- Initialize & Set Backend View:
  git sparse-checkout init --cone
  git sparse-checkout set .github backend

- AUTOMATED COMMAND: Running the automated command. Ensure you are in the root directory of the project when running the command.

- To allow your system to run the command use:
  chmod +x ws-setup.sh

- Frontend view command:
  ./ws-setup.sh frontend

- Backend view command:
  ./ws-setup.sh backend

- To disable run:
  git sparse-checkout disable
