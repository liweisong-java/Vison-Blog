package com.weisong.backend.util.File;

import com.weisong.backend.util.Uuid.UuidBuilderUtils;

public class FileNameUtils {

    /**
     * 获取文件后缀
     * @param fileName
     * @return
     */
    public static String getSuffix(String fileName){
        return fileName.substring(fileName.lastIndexOf("."));
    }
    /**
     * 生成新的文件名
     * @param fileOriginName 源文件名
     * @return
     */
    public static String getFileName(String fileOriginName){
        return UuidBuilderUtils.createUUID() + FileNameUtils.getSuffix(fileOriginName);
    }

}