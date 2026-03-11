import mysql.connector

conn = mysql.connector.connect(
    host="localhost", user="root", password="dbpass", database="vonder_test"
)
cursor = conn.cursor()

with open("stock_flat.txt", encoding="utf-8") as f:
    rows = [line.strip().split(",") for line in f if line.strip()]

sql = "INSERT INTO transactions (ProductName, ColorName, SUM) VALUES (%s, %s, %s)"
data = [(r[0], r[1], int(r[2])) for r in rows]

cursor.executemany(sql, data)
conn.commit()
print(f"Inserted {cursor.rowcount} rows")
cursor.close()
conn.close()