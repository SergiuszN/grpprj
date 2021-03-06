<?php
namespace CloudDriveBundle\Controller;

use CloudDriveBundle\Repository\ShareLinkRepository;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use CloudDriveBundle\Repository\UserRepository;
use CloudDriveBundle\Entity\User;
use CloudDriveBundle\Helpers\FlxZipArchive;
use Symfony\Component\Filesystem\Filesystem;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\JsonResponse;
use CloudDriveBundle\Entity\ShareLink;

class ApiController extends Controller
{
    public function mainPageAction($path = 'home:')
    {
        $response = new JsonResponse();
        $directories = $this->getBaseDirectories($path);

        // scan dir and remove '.' from list and '..' if is home folder
        $list = scandir($directories->pathToOpen);
        array_shift($list);
        if ($directories->pathToOpen == $directories->userDir) {
            array_shift($list);
        }

        $dir = array();
        foreach ($list as $key => $file) {
            if (is_dir($directories->pathToOpen . $file)) {
                $dir['directory'][] = array($file, $this->folderSize($directories->pathToOpen . $file), filemtime($directories->pathToOpen . $file)*1000);
            } else {
                $dir['file'][] = array($file, filesize($directories->pathToOpen . $file), filemtime($directories->pathToOpen . $file)*1000);
            }
        }

        $response->setData(array(
            'url' => $this->generateUrl('cloud_drive_api_main_page', array(), true) . '/',
            'folder' => str_replace('/', ':', 'home:' . str_replace($directories->userDir, '', $directories->pathToOpen)),
            'dir' => $dir,
        ));
        return $response;
    }

    public function uploadAction($path = 'home:') {
        ini_set('upload_max_filesize', '2000M');
        ini_set('post_max_size', '2000M');
        set_time_limit(999999);
        ini_set('max_execution_time', '999999');
        ini_set('max_input_time', '999999');

        $directories = $this->getBaseDirectories($path);

        $uploaddir = $directories->pathToOpen;
        $uploadfile = $uploaddir.basename($_FILES['uploadfile']['name']);
        copy($_FILES['uploadfile']['tmp_name'], $uploadfile);
        unlink($_FILES['uploadfile']['tmp_name']);

        die();
    }

    public function uploadProgressAction()
    {
        $values = array(
            'start_time' => '',
            'content_length' => '',
            'bytes_processed' => '',
            'file' => '',
        );

        if (isset($_SESSION['upload_progress_1'])) {
            $values = array(
                'start_time' => $_SESSION['upload_progress_1']['start_time'],
                'content_length' => $_SESSION['upload_progress_1']['content_length'],
                'bytes_processed' => $_SESSION['upload_progress_1']['bytes_processed'],
                'file' => $_SESSION['upload_progress_1']['files'][0]['name'],
            );
        }

        $response = new JsonResponse();
        $response->setData($values);
        return $response;
    }

    public function createFolderAction($path, $name) {
        $directories = $this->getBaseDirectories($path);
        $newDirectory = $directories->pathToOpen . $name;
        mkdir($newDirectory);
        die();
    }

    public function downloadAction($path, $type) {
        $em = $this->getDoctrine()->getManager();
        /* @var ShareLink $shareLink */
        $shareLink = $em->getRepository('CloudDriveBundle:ShareLink')->getOpenLink($path);

        if ($shareLink != null) {
            $path = $shareLink->getPath();
            $directories = $this->getBaseDirectories($path, $shareLink->getUser());
        } else {
            $directories = $this->getBaseDirectories($path);
        }
        
        if ($type == 'dir') {
            $zip = new FlxZipArchive();
            $tempArchive = $zip->createTempFolderArchive($directories->pathToOpen);
            $this->binaryFileReturn($tempArchive);
        }

        $file = substr($directories->pathToOpen, 0, -1);
        $this->binaryFileReturn($file);
    }

    public function renameAction($path, $newName) {
        $pathOld = substr($this->getBaseDirectories($path)->pathToOpen, 0, -1);
        $pathExplode = explode('/', $pathOld);
        $pathExplode[count($pathExplode)-1] = $newName;
        $pathNew = implode('/', $pathExplode);

        rename ($pathOld, $pathNew);
        die();
    }

    public function deleteAction($path) {
        $directories = $this->getBaseDirectories($path);
        $file = substr($directories->pathToOpen, 0, -1);

        if (is_dir($file)) {
            $this->rRmDir($file);
        } else {
            unlink($file);
        }

        die();
    }

    public function openImageAction($path) {
        $directories = $this->getBaseDirectories($path);
        $file = substr($directories->pathToOpen, 0, -1);
        $response = new BinaryFileResponse($file);
        return $response;
    }

    public function getShareLinkAction($path) {
        /* @var User $user */
        $user = $this->getUser();
        $em = $this->getDoctrine()->getManager();

        /* @var ShareLinkRepository $shareLinkRepository */
        $shareLinkRepository = $em->getRepository('CloudDriveBundle:ShareLink');
        $shareLink = $shareLinkRepository->getLink($path, $user);

        if ($shareLink == null) {
            $date = new \DateTime();
            $link = md5($user->getUsername() . $path . $user->getEmail() . $date->format('Y-m-d H-i-s'));

            $shareLink = new ShareLink();
            $shareLink->setPath($path);
            $shareLink->setLink($link);
            $shareLink->setUser($user);
            $shareLink->setDate(new \DateTime());
            $em->persist($shareLink);
            $em->flush();
        }

        die($shareLink->getLink());
    }

    // helper functions -----------------------------------------------------------------
    protected function rRmDir($src) {
        $dir = opendir($src);
        while(false !== ( $file = readdir($dir)) ) {
            if (( $file != '.' ) && ( $file != '..' )) {
                $full = $src . '/' . $file;
                if ( is_dir($full) ) {
                    $this->rRmDir($full);
                }
                else {
                    unlink($full);
                }
            }
        }
        closedir($dir);
        rmdir($src);
    }

    protected function binaryFileReturn($file) {
        header('Content-Description: File Transfer');
        header('Content-Type: application/octet-stream');
        header('Content-Disposition: attachment; filename="'.basename($file).'"');
        header('Expires: 0');
        header('Cache-Control: must-revalidate');
        header('Pragma: public');
        header('Content-Length: ' . filesize($file));
        readfile($file);
        exit;
    }

    protected function getBaseDirectories($path, $_user = null) {
        /* @var User $user */
        $user = $this->getUser();

        if ($_user != null) {
            $user = $_user;
        }

        // replace path variable
        $path = str_replace('home:', '', $path);
        $path = str_replace(':', '/', $path);
        $path = str_replace('!', '..', $path);

        // get user directory
        $temp = dirname(__FILE__) . '/../../../uploads/user' . $user->getId();
        if (!file_exists($temp)) {
            mkdir($temp);
        }
        $userDir = realpath($temp) . '/';
        $userDir = str_replace('\\', '/', $userDir);

        // get path to open
        if ($path) {
            $pathToOpen = realpath($userDir . $path) . '/';
            $pathToOpen = str_replace('\\', '/', $pathToOpen);
        } else {
            $pathToOpen = $userDir;
        }

        // create user folder if not exist
        if (!file_exists($userDir)) {
            mkdir($userDir);
        }

        // safety block limited access over user folder
        if (strrpos($pathToOpen, $userDir) === false) {
            die();
        }

        return (object) array(
            'pathToOpen' => $pathToOpen,
            'userDir' => $userDir
        );
    }

    protected function folderSize($dir){
        $count_size = 0;
        $count = 0;
        $dir_array = scandir($dir);
        foreach($dir_array as $key=>$filename){
            if($filename!=".." && $filename!="."){
                if(is_dir($dir."/".$filename)){
                    $new_folderSize = $this->folderSize($dir."/".$filename);
                    $count_size = $count_size + $new_folderSize;
                }else if(is_file($dir."/".$filename)){
                    $count_size = $count_size + filesize($dir."/".$filename);
                    $count++;
                }
            }
        }
        return $count_size;
    }

    /* @return UserRepository */
    protected function getUserRepository()
    {
        return $this->getDoctrine()->getEntityManager()->getRepository('CloudDriveBundle:User');
    }
}
