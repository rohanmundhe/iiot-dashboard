#include <WiFi.h>
#include <ThingSpeak.h>

const char* ssid = "STA_Training";
const char* password = "Madh@54321";

WiFiClient client;

unsigned long channelID = 3407039;

const char* writeAPIKey =
"RDB8AVERROEAYZTL";

#include <Wire.h>
#include <DHT.h>
#include <math.h>

#define DHTPIN 15
#define DHTTYPE DHT22

#define BUZZER_PIN 25

#define MPU_ADDR 0x68
#define PWR_MGMT_1 0x6B
#define ACCEL_XOUT_H 0x3B

DHT dht(DHTPIN, DHTTYPE);

// Your measured baseline
float baseline = 1.147060;

// =========================================
// VIBRATION THRESHOLDS
// =========================================

const float NORMAL_THRESHOLD    = 0.01;
const float WARNING_THRESHOLD   = 0.05;
const float CRITICAL_THRESHOLD  = 0.15;
const float EMERGENCY_THRESHOLD = 0.30;
float lastTemp = 25.0;
float lastHum  = 50.0;
// =========================================
// MPU6050 FUNCTIONS
// =========================================

void writeReg(uint8_t reg, uint8_t value)
{
  Wire.beginTransmission(MPU_ADDR);
  Wire.write(reg);
  Wire.write(value);
  Wire.endTransmission();
}

void readAccel(int16_t accel[3])
{
  Wire.beginTransmission(MPU_ADDR);
  Wire.write(ACCEL_XOUT_H);
  Wire.endTransmission(false);

  Wire.requestFrom(MPU_ADDR, 6, true);

  for (int i = 0; i < 3; i++)
  {
    accel[i] = (Wire.read() << 8) | Wire.read();
  }
}

float getMagnitude()
{
  int16_t a[3];

  readAccel(a);

  float ax = a[0] / 16384.0;
  float ay = a[1] / 16384.0;
  float az = a[2] / 16384.0;

  return sqrt(ax * ax + ay * ay + az * az);
}

// =========================================
// HEALTH FUNCTIONS
// =========================================

int getVibrationHealth(float vib)
{
  if(vib <= NORMAL_THRESHOLD)
    return 100;

  if(vib >= CRITICAL_THRESHOLD)
    return 20;

  float health =
      100.0 -
      ((vib - NORMAL_THRESHOLD) /
      (CRITICAL_THRESHOLD - NORMAL_THRESHOLD))
      * 80.0;

  return (int)health;
}
int getTempHealth(float avgTemp)
{
  if (avgTemp < 30)
    return 100;

  else if (avgTemp < 35)
    return 70;

  else if (avgTemp < 40)
    return 40;

  else
    return 10;
}

float calculateEquipmentHealth(
    int tempHealth,
    int vibrationHealth)
{
  float averageHealth =
      (tempHealth +
       vibrationHealth) / 2.0;

  float minHealth =
      min(tempHealth,
          vibrationHealth);

  float finalHealth =
      0.8 * minHealth +
      0.2 * averageHealth;

  if (tempHealth == 10 ||
      vibrationHealth == 10)
  {
    finalHealth =
        min(finalHealth, 20.0f);
  }

  return finalHealth;
}

String getStatus(float health)
{
  if (health >= 90)
    return "GREEN";

  else if (health >= 70)
    return "YELLOW";

  else if (health >= 40)
    return "ORANGE";

  else
    return "RED";
}
// =========================================
// MAIN MONITORING
// =========================================

void runHealthMonitoring()
{
  float tempSum = 0;
  float humSum = 0;
  float vibrationSum = 0;

  float maxVibration = 0;

  for (int i = 0; i < 20; i++)
  {
    float temp = dht.readTemperature();
    float hum  = dht.readHumidity();

    if (isnan(temp))
    {
    temp = lastTemp;
      }
    else
    {
    lastTemp = temp;
    }

    if (isnan(hum))
    {
     hum = lastHum;
    }
    else
  {
    lastHum = hum;
  }

    float magnitude = getMagnitude();

    float vibration =
        fabs(magnitude - baseline);

    tempSum += temp;
    humSum += hum;
    vibrationSum += vibration;

    if (vibration > maxVibration)
      maxVibration = vibration;

    delay(50);
  }

  // ==============================
  // Averages
  // ==============================

  float avgTemp =
      tempSum / 20.0;

  float avgHum =
      humSum / 20.0;

  float avgVibration =
      vibrationSum / 20.0;

  // ==============================
  // Health Calculation
  // ==============================

  int tempHealth =
      getTempHealth(avgTemp);

  int vibrationHealth =
      getVibrationHealth(avgVibration);

  float finalHealth =
      calculateEquipmentHealth(
          tempHealth,
          vibrationHealth);

  String status =
      getStatus(finalHealth);

  // ==============================
  // Emergency Override
  // ==============================

if (maxVibration >= EMERGENCY_THRESHOLD)
{
  status = "RED";
  finalHealth = min(finalHealth, 15.0f);
}
  // ==============================
  // BUZZER
  // ==============================

  noTone(BUZZER_PIN);

  if (status == "YELLOW")
  {
    tone(BUZZER_PIN, 1000, 200);
  }
  else if (status == "ORANGE")
  {
    tone(BUZZER_PIN, 2000, 500);
  }
  else if (status == "RED")
  {
    tone(BUZZER_PIN, 3000);
  }

  // ==============================
  // SERIAL MONITOR
  // ==============================

  Serial.println();
  Serial.println("====================================");

  Serial.print("Temperature     : ");
  Serial.print(avgTemp);
  Serial.println(" C");

  Serial.print("Humidity        : ");
  Serial.print(avgHum);
  Serial.println(" %");

  Serial.print("Avg Vibration   : ");
  Serial.println(avgVibration, 6);

  Serial.print("Max Vibration   : ");
  Serial.println(maxVibration, 6);

  Serial.print("Temp Health     : ");
  Serial.println(tempHealth);

  Serial.print("Vibration Health: ");
  Serial.println(vibrationHealth);

  Serial.print("Equipment Health: ");
  Serial.print(finalHealth);
  Serial.println("%");

  Serial.print("Status          : ");
  Serial.println(status);

  Serial.println("====================================");
}

// =========================================
// SETUP
// =========================================

void setup()
{
  Serial.begin(115200);

  pinMode(BUZZER_PIN, OUTPUT);

  Wire.begin(21, 22);

  writeReg(PWR_MGMT_1, 0x00);

  dht.begin();

  delay(2000);

  Serial.println("IIoT Equipment Health Monitoring Started");

  WiFi.begin(ssid, password);

Serial.print("Connecting");

while(WiFi.status() != WL_CONNECTED)
{
  delay(500);
  Serial.print(".");
}

Serial.println();
Serial.println("WiFi Connected");

ThingSpeak.begin(client);
}

// =========================================
// LOOP
// =========================================

void loop()
{
  runHealthMonitoring();

  delay(1000);
}