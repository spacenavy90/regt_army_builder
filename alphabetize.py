import json

def alphabetize_game_data(input_file, output_file):
    try:
        with open(input_file, 'r') as f:
            data = json.load(f)
        
        # 1. Keep factions array as is, but sort nested content
        if "factions" in data:
            for faction in data["factions"]:
                # 2. Sort leaders by "id"
                if "leaders" in faction:
                    faction["leaders"].sort(key=lambda x: x.get("id", "").lower())
                
                # 3. Sort units by "id"
                if "units" in faction:
                    faction["units"].sort(key=lambda x: x.get("id", "").lower())

        # 4. Sort OTS by "id"
        if "ots" in data:
            data["ots"].sort(key=lambda x: x.get("id", "").lower())

        # 5. Sort definitions by key (the definition name)
        if "definitions" in data:
            data["definitions"] = dict(sorted(data["definitions"].items()))

        with open(output_file, 'w') as f:
            json.dump(data, f, indent=4)
        
        print(f"Successfully processed {input_file} -> {output_file}")

    except FileNotFoundError:
        print(f"Error: {input_file} not found.")
    except json.JSONDecodeError:
        print(f"Error: Invalid JSON format in {input_file}.")

if __name__ == "__main__":
    alphabetize_game_data('data.json', 'data_sorted.json')