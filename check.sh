#!/bin/bash

echo -e "#### Node services status\n"
pm2 list

echo -e "\n#### DB status\n"
sudo service mysql status

echo -e "\n#### Disk usage\n"
df -t ext4

echo -e "\n#### Ram usage\n"
free -m

echo -e "\n#### ES status\n"
sudo service elasticsearch status
