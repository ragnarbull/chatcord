#!/bin/bash

if test $# -eq 0; then
    echo "Usage: ./genkey.sh <path to store certs directory>"
    exit 0
elif test $# -ne 1; then
    echo "Invalid number of arguments"
    exit 1
fi

ROOTPATH="$1"

# make directories to work from
mkdir -p $ROOTPATH/certs/{server,ca,tmp}

PATH_CA=$ROOTPATH/certs/ca
PATH_SERVER=$ROOTPATH/certs/server
PATH_TMP=$ROOTPATH/certs/tmp

echo "###############################################################################"
echo -e "#\033[91;34m     _____      _  __        _____ _                      _                  \033[0m#"
echo -e "#\033[91;34m    /  ___|    | |/ _|      /  ___(_)                    | |                 \033[0m#"
echo -e "#\033[91;34m    \ \`--.  ___| | |_ ______\ \`--. _  __ _ _ __   ___  __| |                 \033[0m#"
echo -e "#\033[91;34m     \`--. \/ _ \ |  _|______|\`--. \ |/ _\` | '_ \ / _ \/ _\` |                 \033[0m#"
echo -e "#\033[91;34m    /\__/ /  __/ | |        /\__/ / | (_| | | | |  __/ (_| |                 \033[0m#"
echo -e "#\033[91;34m    \____/ \___|_|_|        \____/|_|\__, |_| |_|\___|\__,_|                 \033[0m#"
echo -e "#\033[91;34m                                      __/ |                                  \033[0m#"
echo -e "#\033[91;34m                                     |___/                                   \033[0m#"
echo -e "#\033[91;34m   _____           _         _____                           _               \033[0m#"
echo -e "#\033[91;34m  /  __ \         | |       |  __ \                         | |              \033[0m#"
echo -e "#\033[91;34m  | /  \/ ___ _ __| |_ ___  | |  \/ ___ _ __   ___ _ __ __ _| |_ ___  _ __   \033[0m#"
echo -e "#\033[91;34m  | |    / _ \ '__| __/ __| | | __ / _ \ '_ \ / _ \ '__/ _\` | __/ _ \| '__|  \033[0m#"
echo -e "#\033[91;34m  | \__/\  __/ |  | |_\__ \ | |_\ \  __/ | | |  __/ | | (_| | || (_) | |     \033[0m#"
echo -e "#\033[91;34m   \____/\___|_|   \__|___/  \____/\___|_| |_|\___|_|  \__,_|\__\___/|_|     \033[0m#"
echo -e "#\033[91;34m                                                                             \033[0m#"
echo -e "###############################################################################\n"

echo -e "###############"
echo -e "# Global conf #"
echo -e "###############\n"

# Generate random passphrase
passphrase_length=64
TLS_PASSPHRASE=$(openssl rand -base64 32 | tr -dc 'a-zA-Z0-9' | head -c $passphrase_length)

# Check if .env file exists
if [ -f .env ]; then
    # Check if TLS_PASSPHRASE is already set in .env
    if grep -q "^TLS_PASSPHRASE=" .env; then
        sed -i "s|^TLS_PASSPHRASE=.*$|TLS_PASSPHRASE=\"$TLS_PASSPHRASE\"|" .env
    else
        echo "TLS_PASSPHRASE=\"$TLS_PASSPHRASE\"" >> .env
    fi
else
    echo "TLS_PASSPHRASE=\"$TLS_PASSPHRASE\"" > .env
fi

# Load environment variables from .env file
if [ -f .env ]; then
    source .env
fi

RSABITS=4096

echo -n "RSA bit length [$RSABITS]:"
read RSABITS

if [ ${#RSABITS} -eq 0 ]; then
    RSABITS=4096
fi

EXPIREDAYS=365

echo -n "Expire days [$EXPIREDAYS]:"
read EXPIREDAYS

if [ ${#EXPIREDAYS} -eq 0 ]; then
    EXPIREDAYS=365
fi

# Read passphrase from environment variable or prompt user
PASSPHRASE=${TLS_PASSPHRASE:-""}
if [ -n "$TLS_PASSPHRASE" ]; then
    echo "Passphrase for certs loaded from TLS_PASSPHRASE environment variable."
else
    while [ ${#PASSPHRASE} -lt 16 ]; do
        echo -n "Passphrase for certs [${TLS_PASSPHRASE:+(using TLS_PASSPHRASE from environment)}]:"
        read -s PASSPHRASE
        echo
        if [ ${#PASSPHRASE} -lt 16 ]; then
            echo "Passphrase length cannot be less than 16 chars"
        fi
    done
fi

echo -e "\n################"
echo -e "# OpenSSL conf #"
echo -e "################\n"

GK_C=${TLS_COUNTRY_CODE:-""}

if [ -n "$TLS_COUNTRY_CODE" ]; then
    echo "Country code (C) loaded from TLS_COUNTRY_CODE environment variable: $TLS_COUNTRY_CODE"
else
    while [ -z "$GK_C" ]; do
        echo -n "(C) Country Name (2 letter code) [$GK_C]:"
        IFS= read -r GK_C

        if [ -z "$GK_C" ]; then
            echo "Error: Country Code cannot be empty. Please provide a valid 2-letter country code."
        fi
    done
fi

# Read State or Province Name (ST) from environment variable or prompt user
GK_ST=${TLS_STATE_NAME:-""}
if [ -n "$TLS_STATE_NAME" ]; then
    echo "State/province name loaded from TLS_STATE_NAME environment variable: $TLS_STATE_NAME"
else
    while [ -z "$GK_ST" ]; do
        echo -n "(ST) State or Province Name (full name) [$GK_ST]:"
        IFS= read -r GK_ST

        if [ -z "$GK_ST" ]; then
            echo "Error: State or Province Name cannot be empty. Please provide a valid state or provine name."
        fi
    done
fi

# Read Locality Name (L) from environment variable or prompt user
GK_L=${TLS_LOCALITY_NAME:-""}
if [ -n "$TLS_LOCALITY_NAME" ]; then
    echo "Locality name loaded from TLS_LOCALITY_NAME environment variable: $TLS_LOCALITY_NAME"
else
    while [ -z "$GK_L" ]; do
        echo -n "(L) Locality Name (eg, city) [$GK_L]:"
        IFS= read -r GK_L

        if [ -z "$GK_L" ]; then
            echo "Error: Locality Name cannot be empty. Please provide a valid Locality Name."
        fi
    done
fi

# Read Organization Name (O) from environment variable or prompt user
GK_O=${TLS_ORG_NAME:-""}
if [ -n "$TLS_ORG_NAME" ]; then
    echo "Organization name (O) loaded from TLS_ORG_NAME environment variable: $TLS_ORG_NAME"
else
    while [ -z "$GK_O" ]; do
        echo -n "(O) Organization Name (eg, company) [$GK_O]:"
        IFS= read -r GK_O

        if [ -z "$GK_O" ]; then
            echo "Error: Organization Name cannot be empty. Please provide a valid Organization Name."
        fi
    done
fi

# Read Organizational Unit (OU) name from environment variable or prompt user
GK_OU=${TLS_OU_NAME:-""}
if [ -n "$TLS_OU_NAME" ]; then
    echo "Organizational Unit (OU) name loaded from TLS_OU_NAME environment variable: $TLS_OU_NAME"
else
    echo -n "(OU) Organizational Unit Name (eg, section) [$GK_OU]:"
    IFS= read -r GK_OU
    
    # Set to empty string if the user does not provide a value
    GK_OU=${GK_OU:-""}
fi

# Read Common Name (CN) from environment variable or prompt user
GK_CN=${TLS_CN:-""}
if [ -n "$TLS_CN" ]; then
    echo "Common Name (CN) loaded from TLS_CN environment variable: $TLS_CN"
else
    while [ -z "$GK_CN" ]; do
        echo -n "(CN) Common Name (eg, your name or your server's hostname) [$GK_CN]:"
        IFS= read -r GK_CN

        if [ -z "$GK_CN" ]; then
            echo "Error: Common Name cannot be empty. Please provide a valid Common Name."
        fi
    done
fi

# Read email address from environment variable or prompt user
GK_emailAddress=${TLS_EMAIL_ADDRESS:-""}
if [ -n "$TLS_EMAIL_ADDRESS" ]; then
    echo "Email Address loaded from TLS_EMAIL_ADDRESS environment variable: $TLS_EMAIL_ADDRESS"
else
    while [ -z "$GK_emailAddress" ]; do
        echo -n "(emailAddress) Email Address [${TLS_EMAIL_ADDRESS:+(using TLS_EMAIL_ADDRESS from environment)}]:"
        read GK_emailAddress

        if [ ${#GK_emailAddress} -eq 0 ]; then
            echo "Error: Email Address cannot be empty. Please provide a valid Email Address."
        fi
    done
fi

echo "Please enter the following 'extra' attributes"
echo "to be sent with your certificate request"

# Read Unstructured Name (UN) from environment variable or prompt user
GK_UN=${TLS_UN:-""}
if [ -n "$TLS_UN" ]; then
    echo "Unstructured Name (UN) loaded from TLS_UN environment variable: $TLS_UN"
else
    while [ -z "$GK_UN" ]; do
        echo -n "(UN) An unstructured namee [$GK_UN]:"
        IFS= read -r GK_UN

        if [ ${GK_UN} -eq 0 ]; then
            echo "Error: Unstructured Name (UN) cannot be empty. Please provide a valid UN."
        fi
    done
fi

echo

OTHER_FIELDS=""
ADD_OTHER_FIELD="Y"

# Defaults
DEFAULT_FIELD_NAME="subjectAltName"
# DEFAULT_FIELD_VALUE="DNS:localhost"
DEFAULT_FIELD_VALUE=${TLS_FIELD_VALUE_1:-""}

# Prompt user to accept defaults
echo -n "Add default field: $DEFAULT_FIELD_NAME=$DEFAULT_FIELD_VALUE [Y/N]? "
read ACCEPT_DEFAULTS

if [ "$ACCEPT_DEFAULTS" = "y" ] || [ "$ACCEPT_DEFAULTS" = "Y" ] || [ ${#ACCEPT_DEFAULTS} -eq 0 ]; then
    OTHER_FIELDS="/$DEFAULT_FIELD_NAME=$DEFAULT_FIELD_VALUE"
fi

while [ "$ADD_OTHER_FIELD" = "y" ] || [ "$ADD_OTHER_FIELD" = "Y" ]; do
    ADD_OTHER_FIELD="N"
    echo -n "Add other field [Y/N] ? "
    read ADD_OTHER_FIELD

    if [ "$ADD_OTHER_FIELD" = "y" ] || [ "$ADD_OTHER_FIELD" = "Y" ]; then
        echo -n "Field name [$DEFAULT_FIELD_NAME]: "
        read OTHER_FIELD_NAME

        # Use default if the user presses Enter without entering a value
        if [ ${#OTHER_FIELD_NAME} -eq 0 ]; then
            OTHER_FIELD_NAME=$DEFAULT_FIELD_NAME
        fi

        echo -n "Field value [$DEFAULT_FIELD_VALUE]: "
        read OTHER_FIELD_VALUE

        # Use default if the user presses Enter without entering a value
        if [ ${#OTHER_FIELD_VALUE} -eq 0 ]; then
            OTHER_FIELD_VALUE=$DEFAULT_FIELD_VALUE
        fi

        OTHER_FIELDS="$OTHER_FIELDS/$OTHER_FIELD_NAME=$OTHER_FIELD_VALUE"
    fi
done

echo -e "\n##################"
echo -e "# Generate certs #"
echo -e "##################\n"

######
# CA #
######

echo -e "# CA\n"

openssl genrsa -des3 -passout pass:$PASSPHRASE -out $PATH_CA/ca.key $RSABITS

# Create Authority Certificate
openssl req -new -x509 -days $EXPIREDAYS -key $PATH_CA/ca.key -out $PATH_CA/ca.crt -passin pass:$PASSPHRASE -subj "/C=$GK_C/ST=$GK_ST/L=$GK_L/O=$GK_O/OU=$GK_OU/CN=$GK_UN$GK_emailAddress$OTHER_FIELDS" -extensions v3_ca

##########
# SERVER #
##########

echo -e "\n# Server\n"

# Generate server key
openssl genrsa -out $PATH_SERVER/server.key $RSABITS

# Generate server cert
openssl req -new -key $PATH_SERVER/server.key -out $PATH_TMP/server.csr -passout pass:$PASSPHRASE -subj "/C=$GK_C/ST=$GK_ST/L=$GK_L/O=$GK_O/OU=$GK_OU/CN=$GK_CN$GK_UN$GK_emailAddress$OTHER_FIELDS" -extensions v3_req

# Sign server cert with self-signed cert
openssl x509 -req -days $EXPIREDAYS -passin pass:$PASSPHRASE -in $PATH_TMP/server.csr -CA $PATH_CA/ca.crt -CAkey $PATH_CA/ca.key -set_serial 01 -out $PATH_SERVER/server.crt

# Clean tmp dir

rm -rf $PATH_TMP

echo -e "\nDone !"

exit 0
