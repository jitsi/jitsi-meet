<?php
$interfaceConfig = "/usr/share/jitsi-meet/interface_config.js";
$interfaceConfigBak = "/usr/share/jitsi-meet/jelladmin/interface_config.js.bak";

$config = "/etc/jitsi/meet/jellrtc.com-config.js";
$configBak = "/usr/share/jitsi-meet/jelladmin/config.js.bak";

if($_POST['modify']){
	if($_POST['filename']=="interface_config.js"){
		$orig = $interfaceConfig;
		$backup = $interfaceConfigBak;
	} else {
		$orig = $config;
		$backup = $configBak;
	}
    echo "Making a backup from {$orig} to {$backup}<br />";

    //copy ( $orig,$backup );
    if (!copy($orig, $backup)) {
        echo "failed to copy $file...{$php_errormsg}<br /><br />";
    }
    $newContents = $_POST['contents'];

    if(file_put_contents($orig, $newContents)){
        echo "Successfully modified config: {$orig}<br />";
    } else {
          echo "Failed to modify config file<br /><br />";
    }
}

if($_POST['rollback']){
	if($_POST['filename']==="interface_config.js"){
		$orig = $interfaceConfig;
		$backup = $interfaceConfigBak;
	} else {
		$orig = $config;
		$backup = $configBak;
	}
    
    if (!copy($backup, $orig)) {
        echo "failed to copy $file...{$php_errormsg}<br /><br />";
    }

     echo "Successfully Rolled back config<br /><br />";
}

$interfaceConfigText = file_get_contents($interfaceConfig);
$configText = file_get_contents($config);

?>

<form action="<?=$PHP_SELF?>" method="post">
        interface_config.js:<br />
        <textarea name="contents" style="width: 800px;height: 800px;"><?=$interfaceConfigText?></textarea><br/>
        <input hidden="true" type="text" name="modify" value="1"/>
		<input hidden="true" type="text" name="filename" value="interface_config.js"/>
        <input type="submit" value="Change"/>
</form>

<form action="<?=$PHP_SELF?>" method="post">
        <input hidden="true" type="text" name="rollback" value="1"/>
        <input hidden="true" type="text" name="filename" value="interface_config.js"/>
		<input type="submit" value="Rollback"/>
</form>

<form action="<?=$PHP_SELF?>" method="post">
        config.js:<br />
        <textarea name="contents" style="width: 800px;height: 800px;"><?=$configText?></textarea><br/>
        <input hidden="true" type="text" name="modify" value="1"/>
		<input hidden="true" type="text" name="filename" value="config.js"/>
        <input type="submit" value="Change"/>
</form>

<form action="<?=$PHP_SELF?>" method="post">
        <input hidden="true" type="text" name="rollback" value="1"/>
        <input hidden="true" type="text" name="filename" value="config.js"/>
		<input type="submit" value="Rollback"/>
</form>

