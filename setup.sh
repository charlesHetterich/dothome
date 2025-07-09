# Install Ignite for micro-VMs
sudo curl -L \
  https://github.com/weaveworks/ignite/releases/latest/download/ignite-amd64 \
  -o /usr/local/bin/ignite
sudo chmod +x /usr/local/bin/ignite
sudo apt-get install -y uidmap