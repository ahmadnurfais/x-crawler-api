import subprocess


def run_command(command):
    """The function to run each commands we have"""
    process = subprocess.Popen(
        command, stdout=subprocess.PIPE, stderr=subprocess.PIPE, shell=True
    )
    output, error = process.communicate()
    if process.returncode != 0:
        print(f"Error: {error.decode().strip()}")
    return output.decode().strip()


def get_container_id(image_name):
    """Get the container ID associated with the given image name."""
    command = "docker ps -q --filter ancestor=" + image_name
    container_id = run_command(command)
    return container_id


def stop_and_remove_container(container_id):
    """Stop and remove the specified Docker container."""
    print(f"Stopping container {container_id}...")
    run_command(f"docker stop {container_id}")
    print(f"Removing container {container_id}...")
    run_command(f"docker rm {container_id}")


def remove_image(image_id):
    """Remove the specified Docker image."""
    print(f"Removing image {image_id}...")
    run_command(f"docker image rm {image_id}")


def main(image_name):
    """Stop and remove the Docker container, then remove the image."""
    container_id = get_container_id(image_name)

    if container_id:
        stop_and_remove_container(container_id)

    remove_image(image_name)

    """Build the new container."""
    print("Building the Docker image...")
    run_command(f"docker build -t {image_name} .")
    print("Running the Docker container...")
    # run_command(f"docker run -p 3004:3004 -v /root/Documents/Pandora:/app/data {image_name}")
    run_command(f"docker run -d -p 3004:3004 -v /home/ahmadnurfais/Programming/Python/x-crawler-api/data:/app/data {image_name}")


if __name__ == "__main__":
    # Need to change this IMAGE_NAME with the name of the running container.
    # How to do that: run "docker ps -a", you will see the list of running containers
    IMAGE_NAME = "tweet-harvest-webapp"
    # Or if you want to enter the name when you run the script, comment the above line and uncomment the below line
    # IMAGE_NAME = input("Enter the name of the container: ")
    main(IMAGE_NAME)
