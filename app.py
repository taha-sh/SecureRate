from application import create_app, run_app
import os
import sys
import socket

print("Python executable:", sys.executable)
print("sys.path:", sys.path)

os.environ["SESSION_SECRET"] = "MySessionSecret"

app = create_app()
cert_path = "ssl/cert.pem"
key_path = "ssl/key.pem"

def check_ssl_files(cert_path, key_path):
    if os.path.exists(cert_path) and os.path.exists(key_path):
        print(f"SSL files found: cert_path={cert_path}, key_path={key_path}")
        return True
    else:
        if not os.path.exists(cert_path):
            print(f"Certificate file not found at {cert_path}")
        if not os.path.exists(key_path):
            print(f"Key file not found at {key_path}")
        return False

def get_available_ips():
    available_ips = []
    hostname = socket.gethostname()
    for ip in socket.getaddrinfo(hostname, None):
        available_ips.append(ip[4][0])
    available_ips = list(set(available_ips))
    if "127.0.0.1" in available_ips:
        available_ips.remove("127.0.0.1")
    available_ips.insert(0, "127.0.0.1")
    return available_ips


if __name__ == "__main__":
    host_to_use = "localhost"
    
    if not app.debug or os.environ.get("WERKZEUG_RUN_MAIN") == "true":
        available_ips = get_available_ips()
        
        print("Which IP would you like to run this on?")
        for index, ip in enumerate(available_ips, start=1):
            print(f"{index}. {ip}")
        
        choice = input("Enter the number (default is 1): ")
        if choice.isdigit() and 0 < int(choice) <= len(available_ips):
            host_to_use = available_ips[int(choice) - 1]
        else:
            host_to_use = available_ips[0]
    
    ssl_available = check_ssl_files(cert_path, key_path)
    
    if ssl_available:
        print(f"Running with SSL on {host_to_use}")
        app.run(
            host=host_to_use, port="5000", ssl_context=(cert_path, key_path), debug=True
        )
    else:
        print(f"Running without SSL on {host_to_use}")
        app.run(host=host_to_use, port="5000")
