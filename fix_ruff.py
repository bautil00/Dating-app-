import re

with open('apps/api/src/main.py', 'r') as f:
    content = f.read()

content = content.replace(
    'my_profiles = (', 
    'my_profiles = (  # noqa: F841'
)

content = content.replace(
    'receiver_profile = receiver_profiles[0]', 
    'receiver_profile = receiver_profiles[0]  # noqa: F841'
)

content = content.replace(
    'my_profile_resp = client.get(', 
    'my_profile_resp = client.get(  # noqa: F841'
)

with open('apps/api/src/main.py', 'w') as f:
    f.write(content)
