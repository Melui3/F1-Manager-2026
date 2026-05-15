from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('f1', '0003_profile'),
    ]

    operations = [
        migrations.CreateModel(
            name='GameState',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('budget', models.BigIntegerField(default=0)),
            ],
        ),
    ]
