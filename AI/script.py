#!/usr/bin/env python3
import subprocess
import sys
from pathlib import Path

def run_llm(prompt):
    
    script_dir = Path(__file__).parent.resolve()
    llama_dir = script_dir.parent
    
    cmd = [
        str(llama_dir / "main"),
        "-m", str(llama_dir / "models/vicuna-7b-v1.5.Q4_K_M.gguf"),
        "--repeat_penalty", "1.0",
        "-r", "User:",
        "--color",
        "-t", "12",
        "-p", f"User: {prompt}\n"
    ]
    
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, check=True)
        # Extract only the response part after the prompt
        return result.stdout[result.stdout.find(prompt) + len(prompt):].strip()
    except Exception as e:
        return f"Error: {str(e)}"
    
    #return "This is a test response"

if __name__ == "__main__":
    if len(sys.argv) < 2:
        sys.exit("Error: Please provide a prompt")
    print(run_llm(sys.argv[1]))
