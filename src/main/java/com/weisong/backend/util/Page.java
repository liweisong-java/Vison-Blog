package com.weisong.backend.util;

import com.github.pagehelper.PageInfo;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * @author 李伟松
 * @create 2022-03-17-15:57
 */
public class Page {
    public static Map<String,Object> pageInfoToMap(PageInfo pageInfo)  {
        int recordsCount=pageInfo.getSize();
        int pageCount=pageInfo.getPages();
        List list1 = pageInfo.getList();
        Map<String,Object> map1=new HashMap<>();
        map1.put("recordsCount",recordsCount);
        map1.put("pageCount",pageCount);
        map1.put("list",list1);
        return  map1;
    }
}
