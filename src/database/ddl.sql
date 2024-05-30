CREATE TABLE IF NOT EXISTS meta_data (
    meta_key VARCHAR(256) PRIMARY KEY,
    meta_value VARCHAR(256) DEFAULT NULL
);

INSERT INTO meta_data (meta_key, meta_value)
VALUES ('version', '000.000.000')
ON CONFLICT (meta_key)
    DO NOTHING;

-----------------------------------------------------------------------------------------------------------------------

DO $$
    DECLARE version VARCHAR(256) := (
        SELECT meta_value
        FROM meta_data
        WHERE meta_key = 'version'
    );
    DECLARE v0_1_0 VARCHAR(20) := '000.001.000';

    BEGIN
        -- v0.1.0
        IF version < v0_1_0 THEN
            CREATE TABLE IF NOT EXISTS visitor (
                id SERIAL PRIMARY KEY,
                tid VARCHAR(256) UNIQUE NOT NULL,
                data JSONB NOT NULL
            );

            CREATE TABLE IF NOT EXISTS shop (
                name VARCHAR(64) PRIMARY KEY,
                tid VARCHAR(256),
                bot_token VARCHAR(256) UNIQUE NOT NULL,
                on_maintenance BOOLEAN NOT NULL,
                maintenance_version INTEGER NOT NULL,
                main_description TEXT,
                main_file_tid VARCHAR(256),
                about_description TEXT,
                about_file_tid VARCHAR(256),
                faq_description TEXT,
                faq_file_tid VARCHAR(256),
                owner INTEGER NOT NULL,
                FOREIGN KEY (owner) 
                    REFERENCES visitor (id)
            );

            CREATE TABLE IF NOT EXISTS referral_partner (
                name VARCHAR(64) NOT NULL,
                visitor INTEGER NOT NULL,
                fee INTEGER NOT NULL,
                shop VARCHAR(64) NOT NULL,
                FOREIGN KEY (visitor) 
                    REFERENCES visitor (id),
                FOREIGN KEY (shop) 
                    REFERENCES shop (name)
                    ON UPDATE CASCADE
                    ON DELETE CASCADE,
                PRIMARY KEY (name, shop)
            );

            CREATE TABLE IF NOT EXISTS section (
                name VARCHAR(64) NOT NULL,
                full_name VARCHAR(256) NOT NULL,
                description TEXT NOT NULL,
                file_tid VARCHAR(256),
                parent VARCHAR(64),
                rank INTEGER NOT NULL,
                new_line BOOLEAN NOT NULL,
                shop VARCHAR(64) NOT NULL,
                FOREIGN KEY (parent, shop) 
                    REFERENCES section (name, shop)
                    ON UPDATE CASCADE
                    ON DELETE CASCADE,
                FOREIGN KEY (shop) 
                    REFERENCES shop (name)
                    ON UPDATE CASCADE
                    ON DELETE CASCADE,
                PRIMARY KEY (name, shop)
            );

            CREATE TABLE IF NOT EXISTS tag (
                name VARCHAR(64) NOT NULL,
                shop VARCHAR(64) NOT NULL,
                FOREIGN KEY (shop) 
                    REFERENCES shop (name)
                    ON UPDATE CASCADE
                    ON DELETE CASCADE,
                PRIMARY KEY (name, shop)
            );

            CREATE TABLE IF NOT EXISTS tag_section (
                tag VARCHAR(64) NOT NULL,
                section VARCHAR(64) NOT NULL,
                shop VARCHAR(64) NOT NULL,
                FOREIGN KEY (tag, shop) 
                    REFERENCES tag (name, shop)
                    ON UPDATE CASCADE
                    ON DELETE CASCADE,
                FOREIGN KEY (section, shop) 
                    REFERENCES section (name, shop)
                    ON UPDATE CASCADE
                    ON DELETE CASCADE,
                FOREIGN KEY (shop) 
                    REFERENCES shop (name)
                    ON UPDATE CASCADE
                    ON DELETE CASCADE,
                PRIMARY KEY (tag, section, shop)
            );

            CREATE TABLE IF NOT EXISTS customer (
                id SERIAL PRIMARY KEY,
                tid VARCHAR(256) NOT NULL,
                data JSONB NOT NULL,
                first_name VARCHAR(64),
                last_name VARCHAR(64),
                address TEXT,
                zip_code VARCHAR(64),
                referral VARCHAR(64),
                maintenance_version INTEGER NOT NULL,
                shop VARCHAR(64) NOT NULL,
                FOREIGN KEY (shop) 
                    REFERENCES shop (name)
                    ON UPDATE CASCADE
                    ON DELETE CASCADE,
                FOREIGN KEY (referral, shop) 
                    REFERENCES referral_partner (name, shop)
                    ON UPDATE CASCADE
                    ON DELETE SET NULL
            );

            CREATE TABLE IF NOT EXISTS product (
                name VARCHAR(64) NOT NULL,
                full_name VARCHAR(256) NOT NULL,
                description TEXT NOT NULL,
                created_at TIMESTAMP NOT NULL,
                shop VARCHAR(64) NOT NULL,
                FOREIGN KEY (shop) 
                    REFERENCES shop (name)
                    ON UPDATE CASCADE
                    ON DELETE CASCADE,
                PRIMARY KEY (name, shop)
            );

            CREATE TABLE IF NOT EXISTS tag_product (
                tag VARCHAR(64) NOT NULL,
                product VARCHAR(64) NOT NULL,
                shop VARCHAR(64) NOT NULL,
                FOREIGN KEY (tag, shop) 
                    REFERENCES tag (name, shop)
                    ON UPDATE CASCADE
                    ON DELETE CASCADE,
                FOREIGN KEY (product, shop) 
                    REFERENCES product (name, shop)
                    ON UPDATE CASCADE
                    ON DELETE CASCADE,
                FOREIGN KEY (shop) 
                    REFERENCES shop (name)
                    ON UPDATE CASCADE
                    ON DELETE CASCADE,
                PRIMARY KEY (tag, product, shop)
            );

            CREATE TABLE IF NOT EXISTS option (
                name VARCHAR(64) NOT NULL,
                full_name VARCHAR(256) NOT NULL,
                full_button VARCHAR(256) NOT NULL,
                file_tid VARCHAR(256),
                product VARCHAR(64) NOT NULL,
                shop VARCHAR(64) NOT NULL,
                FOREIGN KEY (product, shop) 
                    REFERENCES product (name, shop)
                    ON UPDATE CASCADE
                    ON DELETE CASCADE,
                FOREIGN KEY (shop) 
                    REFERENCES shop (name)
                    ON UPDATE CASCADE
                    ON DELETE CASCADE,
                PRIMARY KEY (name, product, shop)
            );

            CREATE TABLE IF NOT EXISTS variety (
                name VARCHAR(64) NOT NULL,
                product VARCHAR(64) NOT NULL,
                price INTEGER NOT NULL,
                stock INTEGER NOT NULL,
                shop VARCHAR(64) NOT NULL,
                FOREIGN KEY (product, shop) 
                    REFERENCES product (name, shop)
                    ON UPDATE CASCADE
                    ON DELETE CASCADE,
                FOREIGN KEY (shop) 
                    REFERENCES shop (name)
                    ON UPDATE CASCADE
                    ON DELETE CASCADE,
                PRIMARY KEY (name, product, shop)
            );

            CREATE TABLE IF NOT EXISTS option_variety (
                value VARCHAR(256) NOT NULL,
                option VARCHAR(64) NOT NULL,
                variety VARCHAR(64) NOT NULL,
                product VARCHAR(64) NOT NULL,
                shop VARCHAR(64) NOT NULL,
                FOREIGN KEY (option, product, shop) 
                    REFERENCES option (name, product, shop)
                    ON UPDATE CASCADE
                    ON DELETE CASCADE,
                FOREIGN KEY (variety, product, shop) 
                    REFERENCES variety (name, product, shop)
                    ON UPDATE CASCADE
                    ON DELETE CASCADE,
                FOREIGN KEY (product, shop) 
                    REFERENCES product (name, shop)
                    ON UPDATE CASCADE
                    ON DELETE CASCADE,
                FOREIGN KEY (shop) 
                    REFERENCES shop (name)
                    ON UPDATE CASCADE
                    ON DELETE CASCADE,
                PRIMARY KEY (option, variety, product, shop)
            );

            CREATE TABLE IF NOT EXISTS variety_media (
                name VARCHAR(64) NOT NULL,
                variety VARCHAR(64) NOT NULL,
                product VARCHAR(64) NOT NULL,
                file_tid VARCHAR(256) NOT NULL,
                is_main BOOLEAN NOT NULL,
                shop VARCHAR(64) NOT NULL,
                FOREIGN KEY (variety, product, shop) 
                    REFERENCES variety (name, product, shop)
                    ON UPDATE CASCADE
                    ON DELETE CASCADE,
                FOREIGN KEY (product, shop) 
                    REFERENCES product (name, shop)
                    ON UPDATE CASCADE
                    ON DELETE CASCADE,
                FOREIGN KEY (shop) 
                    REFERENCES shop (name)
                    ON UPDATE CASCADE
                    ON DELETE CASCADE,
                PRIMARY KEY (name, variety, product, shop)
            );

            CREATE TABLE IF NOT EXISTS cart_item  (
                customer INTEGER NOT NULL,
                product VARCHAR(64) NOT NULL,
                variety VARCHAR(64) NOT NULL,
                count INTEGER NOT NULL,
                shop VARCHAR(64) NOT NULL,
                FOREIGN KEY (customer) 
                    REFERENCES customer (id)
                    ON DELETE CASCADE,
                FOREIGN KEY (variety, product, shop) 
                    REFERENCES variety (name, product, shop)
                    ON UPDATE CASCADE
                    ON DELETE CASCADE,
                FOREIGN KEY (product, shop) 
                    REFERENCES product (name, shop)
                    ON UPDATE CASCADE
                    ON DELETE CASCADE,
                FOREIGN KEY (shop) 
                    REFERENCES shop (name)
                    ON UPDATE CASCADE
                    ON DELETE CASCADE,
                PRIMARY KEY (customer, product, variety, shop)
            );

            UPDATE meta_data
            SET meta_value = v0_1_0
            WHERE meta_key = 'version';
        END IF;
    END
$$;